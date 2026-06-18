import responsiveImages from '@/data/responsive-images.json'

type ResponsiveImageVariant = {
  src: string
  width: number
  height?: number
}

type ResponsiveImageEntry = {
  width: number
  height: number
  variants: ResponsiveImageVariant[]
}

const manifest = responsiveImages as Record<string, ResponsiveImageEntry>

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

export function getResponsiveImageSrcSet(src: string, basePath = '') {
  const entry = getResponsiveImage(src, basePath)
  if (!entry || entry.variants.length === 0) return undefined

  return entry.variants.map((variant) => `${basePath}${variant.src} ${variant.width}w`).join(', ')
}
