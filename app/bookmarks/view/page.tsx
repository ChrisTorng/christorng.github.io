import BookmarkView from '@/components/bookmarks/BookmarkView'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '書籤', robots: { index: false, follow: false } })
export default function BookmarkDetailPage() {
  return <BookmarkView />
}
