import { defineDocumentType, ComputedFields, makeSource } from 'contentlayer2/source-files'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { imageSize } from 'image-size'
import readingTime from 'reading-time'
import path from 'path'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import { visit } from 'unist-util-visit'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeKatexNoTranslate from 'rehype-katex-notranslate'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import siteMetadata from './data/siteMetadata'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import prettier from 'prettier'
import responsiveImages from './data/responsive-images.json'

const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'
const datePrefixPattern = /^\d{8}--/
const ratingStarPattern = /[★⯨]/gu
const starPath =
  'M12 2.4 14.55 8.65 21.3 9.05 16.15 13.38 17.8 20.2 12 16.55 6.2 20.2 7.85 13.38 2.7 9.05 9.45 8.65 12 2.4Z'
const halfStarPath = 'M12 2.4 12 16.55 6.2 20.2 7.85 13.38 2.7 9.05 9.45 8.65 12 2.4Z'
const ignoredRatingStarTags = new Set(['code', 'kbd', 'pre', 'samp', 'script', 'style', 'textarea'])

type RatingStarNode = {
  type: string
  tagName?: string
  value?: unknown
  children?: RatingStarNode[]
  [key: string]: unknown
}

type RatingStarTextNode = RatingStarNode & {
  type: 'text'
  value: string
}

type MarkdownImageNode = {
  type: string
  url?: string
  alt?: string
  name?: string
  attributes?: Array<{ type: string; name: string; value: string | number | undefined }>
}

type MarkdownParentNode = {
  type: string
  children?: MarkdownImageNode[]
}

const publicRoot = path.join(root, 'public')
const responsiveImageManifest = responsiveImages as Record<
  string,
  { width?: number; height?: number }
>

function safeDecodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function normalizedImagePath(url?: string) {
  if (!url || /^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//')) return undefined

  const pathname = url.split(/[?#]/)[0]
  if (!pathname.startsWith('/')) return undefined

  return pathname
    .split('/')
    .map((segment, index) =>
      index === 0 ? segment : encodeURIComponent(safeDecodePathSegment(segment))
    )
    .join('/')
}

function imageDimensions(url?: string) {
  const manifestEntry = normalizedImagePath(url)
    ? responsiveImageManifest[normalizedImagePath(url) as string]
    : undefined

  if (manifestEntry?.width && manifestEntry.height) {
    return { width: manifestEntry.width, height: manifestEntry.height }
  }

  const imagePath = localPublicImagePath(url)
  if (!imagePath || !existsSync(imagePath)) return undefined

  const dimensions = imageSize(readFileSync(imagePath))
  if (!dimensions.width || !dimensions.height) return undefined

  return { width: dimensions.width, height: dimensions.height }
}

function localPublicImagePath(url?: string) {
  if (!url || /^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//')) return undefined

  const pathname = url.split(/[?#]/)[0]
  if (!pathname.startsWith('/')) return undefined

  const decodedPath = pathname
    .split('/')
    .map((segment, index) => (index === 0 ? segment : safeDecodePathSegment(segment)))
    .join('/')
  const resolvedPath = path.resolve(publicRoot, decodedPath.replace(/^\/+/, ''))
  const resolvedPublicRoot = path.resolve(publicRoot)

  if (
    resolvedPath !== resolvedPublicRoot &&
    !resolvedPath.startsWith(`${resolvedPublicRoot}${path.sep}`)
  ) {
    return undefined
  }

  return resolvedPath
}

function remarkImgToJsx() {
  return (tree: MarkdownParentNode) => {
    visit(
      tree,
      (node: MarkdownParentNode) =>
        node.type === 'paragraph' && node.children?.some((child) => child.type === 'image'),
      (node: MarkdownParentNode) => {
        let converted = false

        node.children = node.children?.map((child) => {
          if (child.type !== 'image') return child

          const dimensions = imageDimensions(child.url)
          if (!dimensions) return child

          converted = true

          return {
            type: 'mdxJsxFlowElement',
            name: 'Image',
            attributes: [
              { type: 'mdxJsxAttribute', name: 'alt', value: child.alt },
              { type: 'mdxJsxAttribute', name: 'src', value: child.url },
              { type: 'mdxJsxAttribute', name: 'width', value: dimensions.width },
              { type: 'mdxJsxAttribute', name: 'height', value: dimensions.height },
            ],
          }
        })

        if (converted) {
          node.type = 'div'
        }
      }
    )
  }
}

function stripDatePrefixFromPath(filePath: string) {
  const parts = filePath.split('/')
  const fileName = parts.pop() || ''
  return [...parts, fileName.replace(datePrefixPattern, '')].join('/')
}

function parseSvgFragment(html: string) {
  const fragment = fromHtmlIsomorphic(html, { fragment: true }) as unknown as {
    children: RatingStarNode[]
  }
  const [svg] = fragment.children

  if (!svg) {
    throw new Error('Unable to parse rating star SVG')
  }

  return svg
}

function createRatingStarIcon(character: string): RatingStarNode {
  const commonAttributes =
    'class="rating-star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"'
  const sourceText = `<span class="rating-star-source">${character}</span>`

  if (character === '★') {
    return parseSvgFragment(
      `<span class="rating-star">${sourceText}<svg ${commonAttributes}><path fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="${starPath}" /></svg></span>`
    )
  }

  return parseSvgFragment(
    `<span class="rating-star">${sourceText}<svg ${commonAttributes}>
        <path fill="currentColor" d="${halfStarPath}" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="${starPath}" />
      </svg></span>`
  )
}

function replaceRatingStarsInText(value: string) {
  const nodes: RatingStarNode[] = []
  let lastIndex = 0

  ratingStarPattern.lastIndex = 0
  for (const match of value.matchAll(ratingStarPattern)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, index) })
    }

    nodes.push(createRatingStarIcon(match[0]))
    lastIndex = index + match[0].length
  }

  if (lastIndex < value.length) {
    nodes.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return nodes
}

function isRatingStarTextNode(node: RatingStarNode): node is RatingStarTextNode {
  return node.type === 'text' && typeof node.value === 'string'
}

function rehypeRatingStars() {
  return (tree: RatingStarNode) => {
    function visitChildren(node: RatingStarNode) {
      if (!node || !Array.isArray(node.children)) return
      if (
        node.type === 'element' &&
        typeof node.tagName === 'string' &&
        ignoredRatingStarTags.has(node.tagName)
      ) {
        return
      }

      for (let index = 0; index < node.children.length; index += 1) {
        const child = node.children[index]

        ratingStarPattern.lastIndex = 0
        if (isRatingStarTextNode(child) && ratingStarPattern.test(child.value)) {
          const replacement = replaceRatingStarsInText(child.value)
          node.children.splice(index, 1, ...replacement)
          index += replacement.length - 1
        } else {
          visitChildren(child)
        }
      }
    }

    visitChildren(tree)
  }
}

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => stripDatePrefixFromPath(doc._raw.flattenedPath).replace(/^.+?(\/)/, ''),
  },
  path: {
    type: 'string',
    resolve: (doc) => stripDatePrefixFromPath(doc._raw.flattenedPath),
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  toc: { type: 'json', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
async function createTagCount(allBlogs) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && file.draft !== true) {
      file.tags.forEach((tag) => {
        if (tag in tagCount) {
          tagCount[tag] += 1
        } else {
          tagCount[tag] = 1
        }
      })
    }
  })
  const sortedTagCount = Object.fromEntries(
    Object.entries(tagCount).sort(([tagA], [tagB]) => (tagA < tagB ? -1 : tagA > tagB ? 1 : 0))
  )
  const formatted = await prettier.format(JSON.stringify(sortedTagCount, null, 2), {
    parser: 'json',
  })
  writeFileSync('./app/tag-data.json', formatted)
}

function createSearchIndex(allBlogs) {
  const publishedBlogs = allBlogs.filter((post) => post.draft !== true)

  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify(allCoreContent(sortPosts(publishedBlogs)))
    )
    console.log('Local search index generated...')
  }
}

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    subtitle: { type: 'string' },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    summary: { type: 'string' },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
    bibliography: { type: 'string' },
    canonicalUrl: { type: 'string' },
  },
  computedFields: {
    ...computedFields,
    structuredData: {
      type: 'json',
      resolve: (doc) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        image: doc.images ? doc.images[0] : siteMetadata.socialBanner,
        url: `${siteMetadata.siteUrl}/${stripDatePrefixFromPath(doc._raw.flattenedPath)}`,
      }),
    },
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    occupation: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    bluesky: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
    layout: { type: 'string' },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [Blog, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: {
            className: ['content-header'],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      rehypeKatexNoTranslate,
      [rehypeCitation, { path: path.join(root, 'data') }],
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypeRatingStars,
      rehypePresetMinify,
    ],
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData()
    createTagCount(allBlogs)
    createSearchIndex(allBlogs)
  },
})
