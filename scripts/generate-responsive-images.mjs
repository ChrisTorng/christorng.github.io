import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { Image } from 'imagescript'

const imageWidths = [320, 480, 768, 1024, 1280, 1600]
const sourceRoot = path.join(process.cwd(), 'public', 'static', 'images')
const outputRoot = path.join(sourceRoot, 'responsive')
const manifestPath = path.join(process.cwd(), 'data', 'responsive-images.json')
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : undefined

function encodePathSegment(segment) {
  return encodeURIComponent(segment)
}

function publicUrlFromRelativePath(relativePath) {
  return `/${relativePath.split(path.sep).map(encodePathSegment).join('/')}`
}

async function collectImageFiles(directory) {
  const entries = await import('fs/promises').then(({ readdir }) =>
    readdir(directory, { withFileTypes: true })
  )
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (path.resolve(absolutePath) === path.resolve(outputRoot)) continue
      files.push(...(await collectImageFiles(absolutePath)))
      continue
    }

    if (!entry.isFile()) continue
    if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath)
    }
  }

  return files
}

async function encodeImage(image, extension) {
  if (extension === '.jpg' || extension === '.jpeg') return image.encodeJPEG(82)
  if (extension === '.webp') return image.encodeWEBP(82)
  return image.encode(3)
}

async function generateVariant(sourceImage, sourcePath, width) {
  const extension = path.extname(sourcePath).toLowerCase()
  const sourceRelative = path.relative(sourceRoot, sourcePath)
  const sourceDirectory = path.dirname(sourceRelative)
  const sourceBaseName = path.basename(sourceRelative, path.extname(sourceRelative))
  const height = Math.max(1, Math.round((sourceImage.height * width) / sourceImage.width))
  const outputDirectory = path.join(outputRoot, sourceDirectory)
  const outputPath = path.join(outputDirectory, `${sourceBaseName}-${width}w${extension}`)
  const outputRelative = path.relative(path.join(process.cwd(), 'public'), outputPath)

  if (!dryRun) {
    await mkdir(outputDirectory, { recursive: true })
    const resized = sourceImage.clone().resize(width, height, Image.RESIZE_AUTO)
    await writeFile(outputPath, await encodeImage(resized, extension))
  }

  return {
    src: publicUrlFromRelativePath(outputRelative),
    width,
    height,
  }
}

async function main() {
  const allFiles = (await collectImageFiles(sourceRoot)).sort()
  const files = Number.isFinite(limit) ? allFiles.slice(0, limit) : allFiles
  const manifest = {}
  let generatedCount = 0

  if (!dryRun) {
    await rm(outputRoot, { recursive: true, force: true })
  }

  for (const file of files) {
    try {
      const sourceImage = await Image.decode(await readFile(file))
      const widths = imageWidths.filter((width) => width < sourceImage.width)

      if (widths.length === 0) continue

      const publicRelative = path.relative(path.join(process.cwd(), 'public'), file)
      const key = publicUrlFromRelativePath(publicRelative)
      const variants = []

      for (const width of widths) {
        variants.push(await generateVariant(sourceImage, file, width))
      }

      generatedCount += variants.length
      manifest[key] = {
        width: sourceImage.width,
        height: sourceImage.height,
        variants,
      }
    } catch (error) {
      console.warn(`Skipping ${path.relative(process.cwd(), file)}: ${error.message}`)
    }
  }

  if (!dryRun) {
    await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`)
    await rm(manifestPath, { force: true })
    await import('fs/promises').then(({ rename }) => rename(`${manifestPath}.tmp`, manifestPath))
  }

  console.log(
    `Responsive images ${dryRun ? 'checked' : 'generated'}: ${Object.keys(manifest).length} source image(s), ${generatedCount} variant(s)`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
