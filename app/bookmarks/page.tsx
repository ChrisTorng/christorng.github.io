import BookmarksList from '@/components/bookmarks/BookmarksList'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '書籤' })
export default function BookmarksPage() {
  return <BookmarksList />
}
