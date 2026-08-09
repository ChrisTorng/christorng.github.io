import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedBlogs } from 'app/blog-utils'
import { getTagDefinitionById, tagDefinitions } from '@/data/tagDefinitions'

const POSTS_PER_PAGE = 20

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tagId = decodeURI(params.tag)
  const tag = getTagDefinitionById(tagId)?.displayName ?? tagId
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tagId}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  return tagDefinitions.map(({ id }) => ({ tag: id }))
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tagId = decodeURI(params.tag)
  const tag = getTagDefinitionById(tagId)
  if (!tag) {
    return notFound()
  }
  const publishedBlogs = getPublishedBlogs(allBlogs)
  const filteredPosts = allCoreContent(
    sortPosts(publishedBlogs.filter((post) => post.tags?.includes(tag.displayName)))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
    basePath: `tags/${tagId}`,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={tag.displayName}
      activePath={`/tags/${tagId}`}
    />
  )
}
