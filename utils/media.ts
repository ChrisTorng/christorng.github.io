const blogMediaPrefix = '/blog-media/'
const blogMediaOrigin =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://media.christorng.idv.tw'

const hasProtocol = (src: string) => /^[a-z][a-z\d+\-.]*:/i.test(src)

export function resolveMediaUrl(src: string, basePath = '') {
  if (!src || hasProtocol(src) || src.startsWith('//')) return src

  if (src.startsWith(blogMediaPrefix)) {
    return `${blogMediaOrigin}/${src.slice(blogMediaPrefix.length)}`
  }

  return src.startsWith('/') ? `${basePath}${src}` : src
}
