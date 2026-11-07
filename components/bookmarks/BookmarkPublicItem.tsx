import BookmarkSource from './BookmarkSource'
import SafeMarkdown from '@/components/notes/SafeMarkdown'

// The public list and the legacy /view/ page must render the same complete
// record. The Cloudflare slug page mirrors this presentation contract.
export type PublicBookmark = {
  id: string
  slug?: string | null
  title: string
  title_original?: string | null
  summary?: string | null
  url: string
  preferred_url?: string | null
  redirect_url?: string | null
  status: number
  tags: string[]
  created_at: string
  status_at?: string | null
  published_at?: string | null
}
export type BookmarkCategory = { id: string; name: string; name_zh?: string | null }

export default function BookmarkPublicItem({
  item,
  categories = [],
  detail = false,
  onTagChange,
}: {
  item: PublicBookmark
  categories?: BookmarkCategory[]
  detail?: boolean
  onTagChange?: (tag: string) => void
}) {
  const target = item.preferred_url || item.redirect_url || item.url
  const date = (item.status_at || item.published_at || item.created_at).slice(0, 10)
  const permalink = item.slug
    ? '/bookmarks/' + encodeURIComponent(item.slug) + '/'
    : '/bookmarks/view/?id=' + encodeURIComponent(item.id)
  const titleLink = (
    <a
      href={target}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
    >
      {item.title}
    </a>
  )
  return (
    <article className="border-b border-gray-300/40 py-4 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        {detail ? (
          <time className="text-gray-500" dateTime={date}>
            {date}
          </time>
        ) : (
          <a
            className="hover:text-primary-500 text-gray-500"
            href={permalink}
            aria-label={date + ' · 書籤永久連結'}
          >
            <time dateTime={date}>{date}</time>
          </a>
        )}
        {item.status === 4 ? (
          <span className="text-primary-500">☆ 推薦</span>
        ) : detail && item.status < 3 ? (
          <span className="text-gray-500">未公開</span>
        ) : null}
      </div>
      {detail ? (
        <h1 className="text-xl leading-snug font-bold">{titleLink}</h1>
      ) : (
        <h2 className="text-xl leading-snug font-bold">{titleLink}</h2>
      )}
      {item.title_original && item.title_original !== item.title && (
        <p lang="en" className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-300">
          {item.title_original}
        </p>
      )}
      {item.summary && (
        <div className="my-2 text-gray-700 dark:text-gray-200">
          <SafeMarkdown text={item.summary} baseUrl={item.url} />
        </div>
      )}
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
        <BookmarkSource url={item.url} />
        {target !== item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden max-w-full truncate underline md:inline"
          >
            原始網址：{item.url}
          </a>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {item.tags.map((name) => {
          const category = categories.find((t) => t.name.toLowerCase() === name.toLowerCase())
          const id = category?.id || name.toLowerCase()
          const label = category?.name_zh || category?.name || name
          return onTagChange ? (
            <button
              key={name}
              type="button"
              onClick={() => onTagChange(id)}
              className="text-primary-500"
            >
              #{label}
            </button>
          ) : (
            <a
              key={name}
              href={'/bookmarks/?tag=' + encodeURIComponent(id)}
              className="text-primary-500"
            >
              #{label}
            </a>
          )
        })}
      </div>
    </article>
  )
}
