import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { notFound } from 'next/navigation'
import { getPublishedBlogs } from 'app/blog-utils'
import { getTagDefinitionById, tagDefinitions, type TagData } from '@/data/tagDefinitions'

const POSTS_PER_PAGE = 20

export const generateStaticParams = async () => {
  const categories = tagData as TagData
  return tagDefinitions.flatMap(({ id }) => {
    const postCount = categories[id].count
    const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      tag: id,
      page: (i + 1).toString(),
    }))
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tagId = decodeURI(params.tag)
  const tag = getTagDefinitionById(tagId)
  if (!tag) {
    return notFound()
  }
  const pageNumber = parseInt(params.page)
  const publishedBlogs = getPublishedBlogs(allBlogs)
  const filteredPosts = allCoreContent(
    sortPosts(publishedBlogs.filter((post) => post.tags?.includes(tag.displayName)))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  // Return 404 for invalid page numbers or empty pages
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
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
