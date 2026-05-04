import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

function getDisplayTag(tagSlug: string) {
  const tagCounts = tagData as Record<string, number>
  return Object.keys(tagCounts).find((tag) => slug(tag) === tagSlug)
}

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tagSlug = decodeURI(params.tag)
  const tag = getDisplayTag(tagSlug) ?? tagSlug
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tagSlug}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  return tagKeys.map((tag) => ({
    tag: encodeURI(slug(tag)),
  }))
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tagSlug = decodeURI(params.tag)
  const title = getDisplayTag(tagSlug)
  if (!title) {
    return notFound()
  }
  const publishedBlogs = allBlogs.filter(
    (post) => process.env.NODE_ENV !== 'production' || !post.draft
  )
  const filteredPosts = allCoreContent(
    sortPosts(
      publishedBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tagSlug))
    )
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
    basePath: `tags/${tagSlug}`,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={title}
      activePath={`/tags/${tagSlug}`}
    />
  )
}
