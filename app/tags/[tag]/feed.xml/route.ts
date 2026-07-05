import { allBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'
import { sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'
import { getPublishedBlogs } from 'app/blog-utils'
import { generateRss } from '@/utils/rss.mjs'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return Object.keys(tagData).map((tag) => ({ tag: slug(tag) }))
}

function getDisplayTag(tagSlug: string) {
  const tagCounts = tagData as Record<string, number>
  return Object.keys(tagCounts).find((tag) => slug(tag) === tagSlug)
}

export async function GET(_request: Request, props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tagSlug = decodeURI(params.tag)
  const tag = getDisplayTag(tagSlug) ?? tagSlug
  const posts = sortPosts(
    getPublishedBlogs(allBlogs).filter((post) =>
      post.tags.map((tag) => slug(tag)).includes(tagSlug)
    )
  )
  const rss = await generateRss(
    { ...siteMetadata, title: `${siteMetadata.title} - ${tag}` },
    posts,
    `tags/${tagSlug}/feed.xml`
  )

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
