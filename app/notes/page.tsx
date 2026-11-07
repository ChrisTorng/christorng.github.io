import NotesList from '@/components/notes/NotesList'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '隨筆', alternates: { types: { 'application/rss+xml': '/notes/feed.xml' } } })
export default function NotesPage() {
  return <NotesList />
}
