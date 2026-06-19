import responsiveImages from '@/data/responsive-images.json'

type ResponsiveImageVariant = {
  src: string
  width: number
  height?: number
}

type ResponsiveImageFormat = 'avif' | 'webp' | 'jpeg'

type ResponsiveImageEntry = {
  width: number
  height: number
  formats?: Partial<Record<ResponsiveImageFormat, ResponsiveImageVariant[]>>
  fallback?: ResponsiveImageVariant
  variants?: ResponsiveImageVariant[]
}

const manifest = responsiveImages as Record<string, ResponsiveImageEntry>
const formatContentTypes: Record<ResponsiveImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
}

function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function encodePathname(pathname: string) {
  return pathname
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(safeDecode(segment))))
    .join('/')
}

export function normalizeResponsiveImagePath(src: string, basePath = '') {
  if (!src || /^[a-z][a-z\d+\-.]*:/i.test(src) || src.startsWith('//')) return undefined

  const pathname = src.split(/[?#]/)[0]
  let normalized = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (basePath && normalized === basePath) return '/'
  if (basePath && normalized.startsWith(`${basePath}/`)) {
    normalized = normalized.slice(basePath.length)
  }

  return encodePathname(normalized)
}

export function getResponsiveImage(src: string, basePath = '') {
  const normalizedPath = normalizeResponsiveImagePath(src, basePath)
  if (!normalizedPath) return undefined

  return manifest[normalizedPath]
}

function variantsForFormat(entry: ResponsiveImageEntry, format: ResponsiveImageFormat) {
  if (entry.formats?.[format]?.length) return entry.formats[format]
  if (format === 'jpeg' && entry.variants?.length) return entry.variants
  return undefined
}

function srcSetForVariants(variants: ResponsiveImageVariant[] | undefined, basePath = '') {
  if (!variants || variants.length === 0) return undefined
  return variants.map((variant) => `${basePath}${variant.src} ${variant.width}w`).join(', ')
}

export function getResponsiveImageSrcSet(
  src: string,
  basePath = '',
  format: ResponsiveImageFormat = 'jpeg'
) {
  const entry = getResponsiveImage(src, basePath)
  if (!entry) return undefined

  return srcSetForVariants(variantsForFormat(entry, format), basePath)
}

export function getResponsiveImageSources(src: string, basePath = '') {
  const entry = getResponsiveImage(src, basePath)
  if (!entry) return []

  return (['avif', 'webp', 'jpeg'] as const)
    .map((format) => ({
      type: formatContentTypes[format],
      srcSet: srcSetForVariants(variantsForFormat(entry, format), basePath),
    }))
    .filter((source): source is { type: string; srcSet: string } => Boolean(source.srcSet))
}

export function getResponsiveImageFallback(src: string, basePath = '') {
  const entry = getResponsiveImage(src, basePath)
  if (!entry) return undefined

  if (entry.fallback) return { ...entry.fallback, src: `${basePath}${entry.fallback.src}` }

  const jpegVariants = variantsForFormat(entry, 'jpeg')
  if (!jpegVariants || jpegVariants.length === 0) return undefined

  const fallback = jpegVariants[Math.max(0, jpegVariants.length - 2)]
  return { ...fallback, src: `${basePath}${fallback.src}` }
}
