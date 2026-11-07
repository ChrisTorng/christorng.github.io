import SafeMarkdown from './SafeMarkdown'

export type PublicNote = {
  id: string
  slug?: string | null
  title?: string | null
  bookmark_title?: string | null
  bookmark_id?: string | null
  markdown: string
  created_at: string
  published_at?: string | null
  tags: string[]
}
export type NoteCategory = { id: string; displayName: string; noteCount?: number }

export function publicNoteTitle(note: PublicNote) {
  return (
    note.title ||
    note.bookmark_title ||
    note.markdown
      .split('\n')
      .find((line) => line.trim())
      ?.slice(0, 160) ||
    '隨筆'
  )
}

// Shared, complete Markdown and metadata across /notes/ and legacy /notes/view/.
export default function NotePublicItem({
  note,
  categories = [],
  detail = false,
  onTagChange,
}: {
  note: PublicNote
  categories?: NoteCategory[]
  detail?: boolean
  onTagChange?: (tag: string) => void
}) {
  const title = publicNoteTitle(note)
  const date = (note.published_at || note.created_at).slice(0, 10)
  const href = note.slug ? '/notes/' + encodeURIComponent(note.slug) + '/' : '/notes/view/?id=' + encodeURIComponent(note.id)
  const titleMarkup = detail ? (
    <h1 className="mt-2 text-xl leading-snug font-bold">{title}</h1>
  ) : (
    <h2 className="mt-2 text-xl leading-snug font-bold">
      <a className="hover:text-primary-500" href={href}>
        {title}
      </a>
    </h2>
  )
  return (
    <article className="border-b border-gray-300/40 py-4 dark:border-gray-700">
      <time className="text-xs text-gray-500" dateTime={date}>
        {date}
      </time>
      {titleMarkup}
      <div className="mt-3">
        <SafeMarkdown text={note.markdown} />
      </div>
      {note.bookmark_id && (
        <a
          className="text-primary-500 mt-3 inline-block text-sm"
          href={'/bookmarks/view/?id=' + encodeURIComponent(note.bookmark_id)}
        >
          參考書籤 ↗
        </a>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {note.tags.map((id) => {
          const label = categories.find((category) => category.id === id)?.displayName || id
          return onTagChange ? (
            <button key={id} type="button" className="text-primary-500" onClick={() => onTagChange(id)}>
              #{label}
            </button>
          ) : (
            <a key={id} href={'/notes/?tag=' + encodeURIComponent(id)} className="text-primary-500">
              #{label}
            </a>
          )
        })}
      </div>
    </article>
  )
}
