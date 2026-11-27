'use client'

import { useState } from 'react'
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
  reading_summary?: {
    summary: string
    original?: { chars: number | null }
    summary_metrics?: { chars: number }
    reduction_percent?: number | null
    stats_lines?: string[]
  } | null
  image_url?: string | null
  url: string
  preferred_url?: string | null
  redirect_url?: string | null
  references?: { url: string; title: string; kind: string }[]
  related_notes_html?: string
  status: number
  tags: string[]
  created_at: string
  status_at?: string | null
  published_at?: string | null
}
export type BookmarkCategory = { id: string; name: string; name_zh?: string | null }

function safeImageUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

function ReadingStats({ reading }: { reading: NonNullable<PublicBookmark['reading_summary']> }) {
  const reduction =
    typeof reading.reduction_percent === 'number' && Number.isFinite(reading.reduction_percent)
      ? reading.reduction_percent
      : null
  const green = Math.max(0, Math.min(100, reduction ?? 0))
  const fmt = (n?: number | null) =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0 ? String(n) : '未知'
  return (
    <div className="mt-1 mb-2 text-xs text-gray-600 dark:text-gray-300">
      {reduction !== null && (
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#64748b',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 4,
          }}
        >
          <span style={{ background: '#22a06b', width: green + '%', height: '100%' }} />
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
          gap: 2,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          fontSize: 'clamp(9px, 3vw, 12px)',
        }}
      >
        <span>原文 {fmt(reading.original?.chars)} 字</span>
        <span style={{ textAlign: 'center' }}>摘要 {fmt(reading.summary_metrics?.chars)} 字</span>
        <span style={{ textAlign: 'right' }}>
          {reduction === null
            ? '縮減未知'
            : (reduction >= 0 ? '縮減 ' : '增加 ') + Math.abs(reduction) + '%'}
        </span>
      </div>
    </div>
  )
}

export default function BookmarkPublicItem({
  item,
  categories = [],
  detail = false,
  embedded = false,
  onTagChange,
}: {
  item: PublicBookmark
  categories?: BookmarkCategory[]
  detail?: boolean
  embedded?: boolean
  onTagChange?: (tag: string) => void
}) {
  const target = item.preferred_url || item.redirect_url || item.url
  const date = (item.status_at || item.published_at || item.created_at).slice(0, 10)
  const permalink = item.slug
    ? '/bookmarks/' + encodeURIComponent(item.slug) + '/'
    : '/bookmarks/view/?id=' + encodeURIComponent(item.id)
  const image = safeImageUrl(item.image_url)
  const [imageFailed, setImageFailed] = useState(false)
  const titleLink = (
    <a
      href={permalink}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
    >
      {item.title}
    </a>
  )
  return (
    <article className="border-b border-gray-300/40 py-4 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <time className="text-gray-500" dateTime={date}>
          {date}
        </time>
        {item.status === 4 ? (
          <span className="text-primary-500">☆ 推薦</span>
        ) : detail && item.status < 3 ? (
          <span className="text-gray-500">未公開</span>
        ) : null}
        {!embedded && (
          <a
            className="hover:text-primary-500 text-gray-500"
            href={'/bookmarks/admin/?edit=' + encodeURIComponent(item.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            後台管理 ↗
          </a>
        )}
      </div>
      <div
        className={
          image && !imageFailed
            ? 'grid grid-cols-1 gap-x-4 md:grid-cols-[minmax(0,1fr)_11rem]'
            : 'block'
        }
      >
        <div className="min-w-0">
          {detail ? (
            <h1 className="text-xl leading-snug font-bold">{titleLink}</h1>
          ) : (
            <h2 className="text-xl leading-snug font-bold">{titleLink}</h2>
          )}
          <p className="mt-1 text-sm leading-snug">
            <a
              className="text-primary-500 hover:text-primary-600"
              href={target}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title_original && item.title_original !== item.title
                ? item.title_original
                : '原始網頁'}
            </a>
          </p>
        </div>
        {image && !imageFailed && (
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="開啟原始文章"
            className="mt-2 block w-full max-w-56 md:col-start-2 md:row-span-2 md:mt-0 md:max-w-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              width={176}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-h-40 w-full rounded-md object-contain"
              onError={() => setImageFailed(true)}
            />
          </a>
        )}
        {item.summary && (
          <div className="my-2 min-w-0 text-gray-700 dark:text-gray-200">
            <SafeMarkdown text={item.summary} baseUrl={item.url} />
          </div>
        )}
      </div>
      {detail && item.reading_summary?.summary && (
        <section className="my-3 min-w-0" aria-label="精讀摘要">
          <p className="font-bold">精讀摘要</p>
          <ReadingStats reading={item.reading_summary} />
          <SafeMarkdown text={item.reading_summary.summary} baseUrl={item.url} />
        </section>
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
      {!!item.references?.length && (
        <div
          className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm"
          aria-label="延伸參考網址"
        >
          {item.references.map((reference) => (
            <a
              key={reference.url}
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              title={reference.title}
              className="text-primary-500 hover:text-primary-600 inline-flex max-w-full min-w-0 items-center gap-1.5"
            >
              {reference.kind === 'hacker-news' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="https://news.ycombinator.com/favicon.ico"
                  alt=""
                  width={16}
                  height={16}
                  loading="lazy"
                  className="h-4 w-4 shrink-0"
                />
              ) : (
                <span aria-hidden="true">↗</span>
              )}
              <span className="min-w-0 break-words">
                {reference.kind === 'hacker-news' ? 'Hacker News 留言' : reference.title}
              </span>
            </a>
          ))}
        </div>
      )}
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
      {!embedded && item.related_notes_html && (
        <aside
          aria-label="引用隨筆"
          className="border-primary-500 mt-3 min-w-0 rounded-r-lg border-l-4 bg-gray-50/60 px-3 py-2 dark:bg-gray-800/40"
        >
          <hr />
          <p>
            <strong>引用隨筆</strong>
          </p>
          <div dangerouslySetInnerHTML={{ __html: item.related_notes_html }} />
        </aside>
      )}
    </article>
  )
}
