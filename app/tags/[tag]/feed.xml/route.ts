import { allBlogs } from 'contentlayer/generated'
import { sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { getPublishedBlogs } from 'app/blog-utils'
import { generateRss } from '@/utils/rss.mjs'
import { getTagDefinitionById, tagDefinitions } from '@/data/tagDefinitions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return tagDefinitions.map(({ id }) => ({ tag: id }))
}

export async function GET(_request: Request, props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tagId = decodeURI(params.tag)
  const tag = getTagDefinitionById(tagId)
  if (!tag) {
    return notFound()
  }
  const posts = sortPosts(
    getPublishedBlogs(allBlogs).filter((post) => post.tags.includes(tag.displayName))
  )
  const rss = await generateRss(
    { ...siteMetadata, title: `${siteMetadata.title} - ${tag.displayName}` },
    posts,
    `tags/${tagId}/feed.xml`
  )

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
