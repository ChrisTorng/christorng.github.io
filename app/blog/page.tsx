import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { getPublishedBlogs } from 'app/blog-utils'

const POSTS_PER_PAGE = 20

export const metadata = genPageMetadata({ title: '所有文章' })

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const publishedBlogs = getPublishedBlogs(allBlogs)
  const posts = allCoreContent(sortPosts(publishedBlogs))
  const pageNumber = 1
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber)
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
    basePath: 'blog',
  }

  return (
    <ListLayout
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="所有文章"
      activePath="/blog"
    />
  )
}
