import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { notFound } from 'next/navigation'
import { getPublishedBlogs } from 'app/blog-utils'

const POSTS_PER_PAGE = 5

function getDisplayTag(tagSlug: string) {
  const tagCounts = tagData as Record<string, number>
  return Object.keys(tagCounts).find((tag) => slug(tag) === tagSlug)
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  return Object.keys(tagCounts).flatMap((tag) => {
    const postCount = tagCounts[tag]
    const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      tag: encodeURI(slug(tag)),
      page: (i + 1).toString(),
    }))
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tagSlug = decodeURI(params.tag)
  const title = getDisplayTag(tagSlug)
  if (!title) {
    return notFound()
  }
  const pageNumber = parseInt(params.page)
  const publishedBlogs = getPublishedBlogs(allBlogs)
  const filteredPosts = allCoreContent(
    sortPosts(
      publishedBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tagSlug))
    )
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
