import { coreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayout'
import { getDraftBlogs } from 'app/blog-utils'

export const metadata = genPageMetadata({
  title: '草稿',
  description: '尚未公開發佈的文章草稿',
  robots: { index: false, follow: false },
})

export default async function DraftPage() {
  const draftBlogs = getDraftBlogs(allBlogs)
  const posts = sortPosts(draftBlogs).map((post) => coreContent(post))

  return <ListLayout posts={posts} title="草稿" />
}
