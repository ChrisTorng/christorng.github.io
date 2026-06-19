import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const imageWidths = [320, 480, 768, 1024, 1280, 1600]
const logoWidths = [64, 108, 160]
const avatarWidths = [96, 192, 320]
const sourceRoot = path.join(process.cwd(), 'public', 'static', 'images')
const outputRoot = path.join(sourceRoot, 'responsive')
const manifestPath = path.join(process.cwd(), 'data', 'responsive-images.json')
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const outputFormats = [
  { key: 'avif', extension: '.avif' },
  { key: 'jpeg', extension: '.jpg' },
]
const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : undefined

function encodePathSegment(segment) {
  return encodeURIComponent(segment)
}

function publicUrlFromRelativePath(relativePath) {
  return `/${relativePath.split(path.sep).map(encodePathSegment).join('/')}`
}

function imageWidthsForFile(relativePath) {
  const fileName = path.basename(relativePath).toLowerCase()

  if (fileName.startsWith('logo.')) return logoWidths
  if (fileName.startsWith('avatar.')) return avatarWidths

  return imageWidths
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

async function resizeImage(sourcePath, width, format) {
  const image = sharp(sourcePath).rotate().resize({
    width,
    withoutEnlargement: true,
  })

  if (format === 'avif') {
    return image.avif({ quality: 58 }).toBuffer()
  }

  return image.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}

async function generateVariant(sourceMetadata, sourcePath, width, format) {
  const sourceRelative = path.relative(sourceRoot, sourcePath)
  const sourceDirectory = path.dirname(sourceRelative)
  const sourceBaseName = path.basename(sourceRelative, path.extname(sourceRelative))
  const height = Math.max(1, Math.round((sourceMetadata.height * width) / sourceMetadata.width))
  const outputDirectory = path.join(outputRoot, sourceDirectory)
  const outputPath = path.join(outputDirectory, `${sourceBaseName}-${width}w${format.extension}`)
  const outputRelative = path.relative(path.join(process.cwd(), 'public'), outputPath)
  const resized = await resizeImage(sourcePath, width, format.key)

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

      const publicRelative = path.relative(path.join(process.cwd(), 'public'), file)
      const sourceRelative = path.relative(sourceRoot, file)
      const widths = imageWidthsForFile(sourceRelative).filter(
        (width) => width < sourceMetadata.width
      )

      if (widths.length === 0) continue

      const key = publicUrlFromRelativePath(publicRelative)
      const formats = Object.fromEntries(outputFormats.map((format) => [format.key, []]))

      for (const width of widths) {
        for (const format of outputFormats) {
          formats[format.key].push(await generateVariant(sourceMetadata, file, width, format))
          generatedCount += 1
        }
      }

      const jpegVariants = formats.jpeg
      const fallbackIndex = Math.max(0, jpegVariants.length - 2)

      manifest[key] = {
        width: sourceMetadata.width,
        height: sourceMetadata.height,
        formats,
        fallback: jpegVariants[fallbackIndex],
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
