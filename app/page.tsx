import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'
import { getPublishedBlogs } from './blog-utils'

export default async function Page() {
  const publishedBlogs = getPublishedBlogs(allBlogs)
  const sortedPosts = sortPosts(publishedBlogs)
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
