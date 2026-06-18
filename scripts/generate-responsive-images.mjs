import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

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

async function resizeImage(sourcePath, width, extension) {
  const image = sharp(sourcePath).rotate().resize({
    width,
    withoutEnlargement: true,
  })

  if (extension === '.jpg' || extension === '.jpeg') {
    return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  }

  if (extension === '.webp') {
    return image.webp({ quality: 82 }).toBuffer()
  }

  return image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
}

async function generateVariant(sourceMetadata, sourcePath, width) {
  const extension = path.extname(sourcePath).toLowerCase()
  const sourceRelative = path.relative(sourceRoot, sourcePath)
  const sourceDirectory = path.dirname(sourceRelative)
  const sourceBaseName = path.basename(sourceRelative, path.extname(sourceRelative))
  const height = Math.max(1, Math.round((sourceMetadata.height * width) / sourceMetadata.width))
  const outputDirectory = path.join(outputRoot, sourceDirectory)
  const outputPath = path.join(outputDirectory, `${sourceBaseName}-${width}w${extension}`)
  const outputRelative = path.relative(path.join(process.cwd(), 'public'), outputPath)
  const resized = await resizeImage(sourcePath, width, extension)

  if (!dryRun) {
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(outputPath, resized)
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
      const sourceMetadata = await sharp(file).metadata()
      if (!sourceMetadata.width || !sourceMetadata.height) {
        throw new Error('Unable to read image dimensions')
      }

      const widths = imageWidths.filter((width) => width < sourceMetadata.width)

      if (widths.length === 0) continue

      const publicRelative = path.relative(path.join(process.cwd(), 'public'), file)
      const key = publicUrlFromRelativePath(publicRelative)
      const variants = []

      for (const width of widths) {
        variants.push(await generateVariant(sourceMetadata, file, width))
      }

      generatedCount += variants.length
      manifest[key] = {
        width: sourceMetadata.width,
        height: sourceMetadata.height,
        variants,
      }
    } catch (error) {
      console.warn(`Skipping ${path.relative(process.cwd(), file)}: ${error.message}`)
    }
  }

  if (files.length > 0 && generatedCount === 0) {
    throw new Error('No responsive image variants were generated')
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
