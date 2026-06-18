import { allBlogs } from 'contentlayer/generated'
import { sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { getPublishedBlogs } from 'app/blog-utils'
import { generateRss } from '@/utils/rss.mjs'

export const dynamic = 'force-static'

export async function GET() {
  const posts = sortPosts(getPublishedBlogs(allBlogs))
  const rss = await generateRss(siteMetadata, posts)

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
