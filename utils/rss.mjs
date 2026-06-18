import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import responsiveImages from '../data/responsive-images.json' with { type: 'json' }

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function getSiteUrl(config) {
  return config.siteUrl.replace(/\/$/, '')
}

function absoluteUrl(config, pathname) {
  if (!pathname) return pathname
  if (/^[a-z][a-z\d+\-.]*:/i.test(pathname)) return pathname
  if (pathname.startsWith('//')) return `https:${pathname}`

  const siteUrl = getSiteUrl(config)
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${siteUrl}${path}`
}

function absolutePostUrl(config, post) {
  return absoluteUrl(config, post.path || `blog/${post.slug}`)
}

function safeDecode(segment) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function encodePathname(pathname) {
  return pathname
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(safeDecode(segment))))
    .join('/')
}

function normalizeResponsiveImagePath(src) {
  if (!src || /^[a-z][a-z\d+\-.]*:/i.test(src) || src.startsWith('//')) return undefined

  const pathname = src.split(/[?#]/)[0]
  return encodePathname(pathname.startsWith('/') ? pathname : `/${pathname}`)
}

function responsiveImageSrcSet(src) {
  const normalizedPath = normalizeResponsiveImagePath(src)
  const entry = normalizedPath ? responsiveImages[normalizedPath] : undefined

  if (!entry || !entry.variants || entry.variants.length === 0) return undefined

  return entry.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ')
}

function addResponsiveImageAttributes(html) {
  return html.replace(/<img\b([^>]*?)>/g, (match, attributes) => {
    if (/\bsrcset\s*=/i.test(attributes)) return match

    const src = getAttributeValue(attributes, 'src')
    const srcSet = responsiveImageSrcSet(src)
    if (!srcSet) return match

    const selfClosing = /\/\s*>$/.test(match)
    const suffix = selfClosing ? ' />' : '>'
    const trimmed = attributes.replace(/\s*\/\s*$/, '').trimEnd()
    return `<img${trimmed} srcset="${escapeXml(srcSet)}" sizes="(max-width: 768px) 100vw, 768px"${suffix}`
  })
}

function absoluteHtmlUrls(config, html, postUrl) {
  const withAbsoluteAttributes = html.replace(
    /\b(href|src|poster)=("([^"]*)"|'([^']*)')/g,
    (match, attribute, quoted, doubleValue, singleValue) => {
      const value = doubleValue ?? singleValue ?? ''

      if (!value || /^[a-z][a-z\d+\-.]*:/i.test(value)) {
        return match
      }

      const absoluteValue = value.startsWith('#')
        ? `${postUrl}${value}`
        : absoluteUrl(config, value)
      const quote = quoted.startsWith('"') ? '"' : "'"
      return `${attribute}=${quote}${absoluteValue}${quote}`
    }
  )

  return withAbsoluteAttributes.replace(
    /\b(srcSet|srcset)=("([^"]*)"|'([^']*)')/g,
    (match, attribute, quoted, doubleValue, singleValue) => {
      const value = doubleValue ?? singleValue ?? ''
      if (!value) return match

      const absoluteValue = value
        .split(',')
        .map((candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/)
          const suffix = descriptor.length > 0 ? ` ${descriptor.join(' ')}` : ''
          return `${absoluteUrl(config, url)}${suffix}`
        })
        .join(', ')
      const quote = quoted.startsWith('"') ? '"' : "'"
      return `${attribute}=${quote}${absoluteValue}${quote}`
    }
  )
}

function cdata(value) {
  return `<![CDATA[${String(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`
}

function authorXml(config) {
  if (!config.email) {
    return config.author ? `<dc:creator>${escapeXml(config.author)}</dc:creator>` : ''
  }

  return `<author>${escapeXml(`${config.email} (${config.author})`)}</author>`
}

function editorXml(config, tagName) {
  if (!config.email) return ''

  return `<${tagName}>${escapeXml(`${config.email} (${config.author})`)}</${tagName}>`
}

function getAttributeValue(attributes, name) {
  const pattern = new RegExp(`${name}=("(.*?)"|'(.*?)'|\\{\\s*["'\`](.*?)["'\`]\\s*\\})`)
  const match = attributes.match(pattern)
  return match?.[2] ?? match?.[3] ?? match?.[4] ?? ''
}

function replaceSelfClosingComponent(markdown, componentName, replacement) {
  const pattern = new RegExp(`<${componentName}\\s+([\\s\\S]*?)\\s*/>`, 'g')
  return markdown.replace(pattern, (_match, attributes) => replacement(attributes))
}

function normalizeMdxComponents(markdown) {
  let normalized = replaceSelfClosingComponent(markdown, 'YouTubeEmbed', (attributes) => {
    const id = getAttributeValue(attributes, 'id')
    const title = getAttributeValue(attributes, 'title') || `YouTube: ${id}`
    return `<p><a href="https://www.youtube.com/watch?v=${escapeXml(id)}">${escapeXml(title)}</a></p>`
  })

  normalized = replaceSelfClosingComponent(normalized, 'AudioPlayer', (attributes) => {
    const src = getAttributeValue(attributes, 'src')
    const title = getAttributeValue(attributes, 'title') || src
    return `<figure><audio controls preload="metadata" src="${escapeXml(src)}"><a href="${escapeXml(src)}">${escapeXml(title)}</a></audio></figure>`
  })

  normalized = replaceSelfClosingComponent(normalized, 'VideoPlayer', (attributes) => {
    const src = getAttributeValue(attributes, 'src')
    const title = getAttributeValue(attributes, 'title') || src
    return `<figure><video controls preload="metadata" src="${escapeXml(src)}"><a href="${escapeXml(src)}">${escapeXml(title)}</a></video></figure>`
  })

  return replaceSelfClosingComponent(normalized, 'Image', (attributes) => {
    const src = getAttributeValue(attributes, 'src')
    const alt = getAttributeValue(attributes, 'alt')
    const width = getAttributeValue(attributes, 'width')
    const height = getAttributeValue(attributes, 'height')
    return `<img src="${escapeXml(src)}" alt="${escapeXml(alt)}"${width ? ` width="${escapeXml(width)}"` : ''}${height ? ` height="${escapeXml(height)}"` : ''} />`
  })
}

export async function renderPostContent(config, post) {
  const postUrl = absolutePostUrl(config, post)
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkAlert)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(normalizeMdxComponents(post.body.raw))
  )

  return absoluteHtmlUrls(config, addResponsiveImageAttributes(html), postUrl)
}

export async function generateRssItem(config, post) {
  const postUrl = absolutePostUrl(config, post)
  const description = post.summary ? `<description>${escapeXml(post.summary)}</description>` : ''
  const content = await renderPostContent(config, post)
  const categories = post.tags
    ? post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('')
    : ''

  return `
  <item>
    <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(postUrl)}</link>
    ${description}
    <content:encoded>${cdata(content)}</content:encoded>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    ${authorXml(config)}
    ${categories}
  </item>`
}

export async function generateRss(config, posts, page = 'feed.xml') {
  const siteUrl = getSiteUrl(config)
  const feedUrl = absoluteUrl(config, page)
  const lastBuildDate = posts[0]?.lastmod || posts[0]?.date || new Date().toISOString()
  const items = await Promise.all(posts.map((post) => generateRssItem(config, post)))

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <link>${escapeXml(`${siteUrl}/blog`)}</link>
    <description>${escapeXml(config.description)}</description>
    <language>${escapeXml(config.language)}</language>
    ${editorXml(config, 'managingEditor')}
    ${editorXml(config, 'webMaster')}
    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    ${items.join('')}
  </channel>
</rss>
`
}
