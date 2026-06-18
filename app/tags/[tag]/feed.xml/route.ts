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

export async function GET(_request: Request, props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const posts = sortPosts(
    getPublishedBlogs(allBlogs).filter((post) =>
      post.tags.map((tag) => slug(tag)).includes(params.tag)
    )
  )
  const rss = await generateRss(siteMetadata, posts, `tags/${params.tag}/feed.xml`)

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
