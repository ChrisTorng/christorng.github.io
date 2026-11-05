import BookmarkView from '@/components/bookmarks/BookmarkView'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '書籤詳情' })
export default function BookmarkDetailPage() {
  return <BookmarkView />
}
