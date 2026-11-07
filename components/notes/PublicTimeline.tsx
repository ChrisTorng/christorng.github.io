'use client'
import { notesDiscoveryEnabled } from '@/data/notesSettings'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from '@/components/Link'
import { Rss } from '@/components/social-icons/icons'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import { formatNoteDate } from '@/components/ListWithCategories'
import SafeMarkdown from '@/components/notes/SafeMarkdown'
import { tagDefinitions } from '@/data/tagDefinitions'
import PublicCategorySidebar from '@/components/PublicCategorySidebar'
import MobileCategorySelect from '@/components/MobileCategorySelect'

type Article = {
  slug: string
  title: string
  subtitle?: string
  summary?: string
  date: string
  tags: string[]
}
type Entry = {
  kind: 'blog' | 'note'
  id?: string
  title: string | null
  displayTitle?: string
  subtitle?: string
  summary?: string
  markdown?: string
  html?: string
  url?: string
  date: string
  tags: string[]
}
const PER_PAGE = 20

// Keep URL state in a small Suspense boundary so article HTML is still exported.
function TimelineLocation({
  initialPage,
  onPageChange,
}: {
  initialPage: number
  onPageChange: (page: number) => void
}) {
  const searchParams = useSearchParams()
  const queryPage = searchParams.get('page')
  useEffect(() => {
    const value = Number(queryPage)
    onPageChange(Number.isSafeInteger(value) && value > 0 ? value : initialPage)
  }, [queryPage, initialPage, onPageChange])
  return null
}

export default function PublicTimeline({
  articles,
  title = '文章與隨筆',
  description = siteMetadata.description,
  tag = '',
  initialPage = 1,
}: {
  articles: Article[]
  title?: string
  description?: string
  tag?: string
  initialPage?: number
}) {
  const fallback = useMemo<Entry[]>(
    () =>
      articles.map((article) => ({
        ...article,
        kind: 'blog',
        url: `/blog/${article.slug}/`,
        date: new Date(article.date).toISOString(),
      })),
    [articles]
  )
  const [page, setPage] = useState(initialPage)
  const [data, setData] = useState<{
    items: Entry[]
    total: number
    pages: number
  }>({
    items: fallback.slice((initialPage - 1) * PER_PAGE, initialPage * PER_PAGE),
    total: fallback.length,
    pages: Math.max(1, Math.ceil(fallback.length / PER_PAGE)),
  })
  const [warning, setWarning] = useState('')
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!notesDiscoveryEnabled) return
    const controller = new AbortController()
    setLoading(true)
    fetch(`/notes/api/all?page=${page}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('隨筆暫時無法載入，先顯示文章。')
        const result = await response.json()
        if (controller.signal.aborted) return
        setData({
          ...result,
          items: result.items.map((entry: Entry) => {
            if (entry.kind === 'note') return entry
            const pathname = new URL(entry.url!, location.origin).pathname
            return {
              ...fallback.find((article) => article.url === pathname),
              ...entry,
              url: pathname,
            }
          }),
        })
        setWarning(result.warning || '')
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setData({
            items: fallback.slice((page - 1) * PER_PAGE, page * PER_PAGE),
            total: fallback.length,
            pages: Math.max(1, Math.ceil(fallback.length / PER_PAGE)),
          })
          setWarning(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, tag, fallback])
  useEffect(() => {
    if (!notesDiscoveryEnabled) return
    const controller = new AbortController(),
      headers: Record<string, string> = {}
    if (['localhost', '127.0.0.1'].includes(location.hostname)) {
      const token = sessionStorage.getItem('blog-notes-local-token')
      if (token) headers.Authorization = `Bearer ${token}`
    }
    fetch('/notes/api/session', {
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => {
        if (!controller.signal.aborted) setAdmin(Boolean(result.admin))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  function go(next: number) {
    const url = new URL(location.href)
    if (next === 1) url.searchParams.delete('page')
    else url.searchParams.set('page', String(next))
    history.pushState(null, '', (tag ? '/tags/' + tag + '/' : '/') + url.search)
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const categoryLabel = tagDefinitions.find((item) => item.id === tag)?.displayName || tag
  const rssLabel = tag ? categoryLabel + ' · 文章與隨筆 RSS' : '所有文章與隨筆 RSS'
  const topicOptions = [
    { value: '', label: '所有文章與隨筆', href: '/' },
    ...tagDefinitions.map(({ id, displayName }) => ({
      value: id,
      label: displayName,
      href: '/tags/' + id + '/',
    })),
  ]
  return (
    <div
      className={
        tag ? 'grid grid-cols-1 items-start gap-6 md:grid-cols-[244px_minmax(0,1fr)] lg:gap-12' : ''
      }
    >
      {tag && (
        <PublicCategorySidebar
          rootLabel="所有文章與隨筆"
          rootHref="/"
          activeTag={tag}
          categories={tagDefinitions.map(({ id, displayName }) => ({
            id,
            label: displayName,
            href: '/tags/' + id + '/',
          }))}
          LinkComponent={Link}
        />
      )}
      <div className="responsive-layout-container min-w-0 divide-y divide-gray-200 dark:divide-gray-700">
        {tag && <MobileCategorySelect value={tag} options={topicOptions} />}
        <Suspense fallback={null}>
          <TimelineLocation initialPage={initialPage} onPageChange={setPage} />
        </Suspense>
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <div className="flex justify-end">
            <Link
              href={
                tag ? '/notes/all/feed.xml?tag=' + encodeURIComponent(tag) : '/notes/all/feed.xml'
              }
              type="application/rss+xml"
              className="hover:text-primary-500 dark:hover:text-primary-400 inline-flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300"
              aria-label={rssLabel}
            >
              <Rss className="h-5 w-5" aria-hidden="true" />
              {rssLabel}
            </Link>
          </div>
          <h1 className="heading-accent text-3xl leading-9 font-extrabold tracking-tight sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            {title}{' '}
            {!tag && (
              <small className="ml-3 text-base font-normal tracking-normal text-gray-500 sm:text-xl dark:text-gray-400">
                Articles &amp; Notes
              </small>
            )}
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">{description}</p>
          {!tag && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              這裡整合文章與隨筆；收集的網頁另列於{' '}
              <Link href="/bookmarks/" className="text-primary-500 hover:text-primary-600">
                書籤
              </Link>
              ，不包含在此清單及 RSS 中。
            </p>
          )}
          {warning ? (
            <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
              {warning}
            </p>
          ) : null}
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700" aria-busy={loading}>
          {data.items.map((entry) => {
            const url = entry.kind === 'note' ? `/notes/${entry.id}/` : entry.url!
            return (
              <li key={`${entry.kind}:${entry.id || url}`} className="py-10">
                <article>
                  <div className="responsive-date-grid">
                    <div className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      <time dateTime={entry.date}>
                        {entry.kind === 'note'
                          ? formatNoteDate(entry.date)
                          : formatDate(entry.date, siteMetadata.locale)}
                      </time>
                      {entry.kind === 'blog' ? <span className="ml-2 text-sm">文章</span> : null}
                    </div>
                    <div className="responsive-date-content space-y-5">
                      <div>
                        <h2 className="text-2xl leading-8 font-bold tracking-tight">
                          <Link href={url} className="title-link">
                            {entry.displayTitle || entry.title || '隨筆'}
                          </Link>
                        </h2>
                        {entry.subtitle ? (
                          <p className="mt-1 text-lg font-semibold">{entry.subtitle}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap">
                          {entry.tags.map((value) => (
                            <Tag
                              key={value}
                              text={
                                tagDefinitions.find((item) => item.id === value)?.displayName || value
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {entry.kind === 'note' ? (
                        <SafeMarkdown text={entry.markdown || ''} />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">{entry.summary}</p>
                      )}
                      {entry.kind === 'blog' || admin ? (
                        <div className="flex gap-5 text-sm">
                          {entry.kind === 'blog' ? <Link href={url}>進入閱讀 →</Link> : null}
                          {entry.kind === 'note' && admin ? (
                            <Link href={`/notes/editor/?id=${entry.id}`} aria-label="編輯這則隨筆">
                              編輯
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
          {!data.items.length ? <li className="py-8">目前沒有內容。</li> : null}
        </ul>
        {data.pages > 1 ? (
          <nav aria-label="分頁" className="flex items-center justify-between py-8">
            <button onClick={() => go(page - 1)} disabled={page <= 1 || loading}>
              上一頁
            </button>
            <span>
              第 {page} / {data.pages} 頁
            </span>
            <button onClick={() => go(page + 1)} disabled={page >= data.pages || loading}>
              下一頁
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
