import NoteView from '@/components/notes/NoteView'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '隨筆詳情' })
export default function NotePage() {
  return <NoteView />
}
