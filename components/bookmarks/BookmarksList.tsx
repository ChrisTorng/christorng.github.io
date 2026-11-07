'use client'

import { useEffect, useState } from 'react'
import MobileCategorySelect from '@/components/MobileCategorySelect'
import PublicCategorySidebar from '@/components/PublicCategorySidebar'
import BookmarkSource from '@/components/bookmarks/BookmarkSource'
import SafeMarkdown from '@/components/notes/SafeMarkdown'

type Bookmark = {
  id: string
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
type Category = { id: string; name: string; name_zh?: string | null; count: number }
const categoryName = (category: Category) =>
  category.id === 'default' ? '未分類' : category.name_zh || category.name
type Filters = { tag: string; q: string; from: string; to: string; sort: string; page: number }
type Result = { items: Bookmark[]; total: number; page: number; pages: number }
type DateBounds = { earliest: string; latest: string }
const empty: Filters = { tag: '', q: '', from: '', to: '', sort: 'new', page: 1 }
const sortOptions = [
  ['new', '最新'],
  ['old', '最早'],
  ['recommended', '推薦優先'],
  ['title', '依標題'],
]
function parse() {
  const q = new URLSearchParams(location.search)
  return {
    tag: q.get('tag') || '',
    q: q.get('q') || '',
    from: q.get('from') || '',
    to: q.get('to') || '',
    sort: q.get('sort') || 'new',
    page: Math.max(1, Number(q.get('page')) || 1),
  }
}
function queryString(f: Filters) {
  const q = new URLSearchParams()
  if (f.tag) q.set('tag', f.tag)
  if (f.q) q.set('q', f.q)
  if (f.from) q.set('from', f.from)
  if (f.to) q.set('to', f.to)
  if (f.sort !== 'new') q.set('sort', f.sort)
  if (f.page > 1) q.set('page', String(f.page))
  return q.toString()
}
function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}
const fieldStyle =
  'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
export default function BookmarksList() {
  const [ready, setReady] = useState(false)
  const [filters, setFilters] = useState<Filters>(empty)
  const [searchText, setSearchText] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Result>({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [bounds, setBounds] = useState<DateBounds | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const readLocation = () => {
      const next = parse()
      setFilters(next)
      setSearchText(next.q)
      setReady(true)
    }
    readLocation()
    window.addEventListener('popstate', readLocation)
    return () => window.removeEventListener('popstate', readLocation)
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (ready && searchText !== filters.q) {
        setFilters((old) => ({ ...old, q: searchText, page: 1 }))
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [searchText, ready, filters.q])
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    const query = queryString(filters)
    const nextUrl = '/bookmarks/' + (query ? '?' + query : '')
    if (location.pathname + location.search !== nextUrl) {
      history.replaceState(history.state, '', nextUrl)
    }
    setLoading(true)
    setError('')
    fetch('/bookmarks/api/' + (query ? '?' + query : ''), {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('書籤查詢失敗')
        return (await response.json()) as Result
      })
      .then((data) => setResult(data))
      .catch((cause) => {
        if (!controller.signal.aborted) setError(String(cause.message || cause))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [filters, ready])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/bookmarks/api/tags', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('無法載入分類')
        return r.json()
      })
      .then(setCategories)
      .catch(() => {})
    return () => controller.abort()
  }, [])
  // The public API sorts by publication/recommendation date and returns Taiwan-local dates.
  // Fetch only the first oldest/newest record; no Worker changes or schema migration needed.
  useEffect(() => {
    const controller = new AbortController()
    const getEdge = (sort: string) =>
      fetch('/bookmarks/api/?sort=' + sort, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('日期範圍載入失敗')
          return (await response.json()) as Result
        })
        .then((data) =>
          dateOnly(
            data.items[0]?.status_at || data.items[0]?.published_at || data.items[0]?.created_at
          )
        )
    Promise.all([getEdge('old'), getEdge('new')])
      .then(([earliest, latest]) => {
        if (earliest && latest && earliest <= latest) setBounds({ earliest, latest })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  function clampDate(value: string, earliest: string, latest: string) {
    if (!value) return ''
    return value < earliest ? earliest : value > latest ? latest : value
  }
  function changeFrom(value: string) {
    const earliest = bounds?.earliest || '0001-01-01'
    const latest = filters.to || bounds?.latest || '9999-12-31'
    select({ from: clampDate(value, earliest, latest) })
  }
  function changeTo(value: string) {
    const earliest = filters.from || bounds?.earliest || '0001-01-01'
    const latest = bounds?.latest || '9999-12-31'
    select({ to: clampDate(value, earliest, latest) })
  }
  function select(next: Partial<Filters>) {
    setFilters((old) => ({ ...old, ...next, page: next.page || 1 }))
  }
  function changeTag(tag: string) {
    select({ tag })
  }
  const active = categories.find((tag) => tag.id === filters.tag)
  const activeName = active ? categoryName(active) : ''
  useEffect(() => {
    document.title = (activeName ? activeName + ' · 書籤' : '書籤') + ' | ChrisTorng 學習天地'
  }, [activeName])
  const rss = '/bookmarks/feed.xml' + (filters.tag ? '?tag=' + encodeURIComponent(filters.tag) : '')
  return (
    <section className="w-full py-5 pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-accent text-3xl font-extrabold sm:text-5xl">
            {activeName ? activeName + ' · 書籤' : '書籤'}{' '}
            <small className="ml-2 text-lg font-normal text-gray-500">Bookmarks</small>
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">閱讀與分享的網頁收藏</p>
        </div>
        <a
          className="hover:text-primary-500 inline-flex items-center gap-2 text-sm"
          href={rss}
          type="application/rss+xml"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          {activeName ? activeName + ' · 書籤 RSS' : '所有書籤 RSS'}
        </a>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[244px_minmax(0,1fr)] lg:gap-12">
        <PublicCategorySidebar
          rootLabel="所有書籤"
          activeTag={filters.tag}
          categories={categories.map((category) => ({
            id: category.id,
            label: categoryName(category),
            count: category.count,
          }))}
          onChange={changeTag}
        />
        <div className="min-w-0">
          <MobileCategorySelect
            value={filters.tag}
            options={[
              { value: '', label: '所有書籤' },
              ...categories.map((category) => ({
                value: category.id,
                label: categoryName(category),
              })),
            ]}
            onChange={changeTag}
          />
          <div className="mb-3 space-y-2 border-b border-gray-300/30 pb-4 text-sm dark:border-gray-700">
            <div className="flex w-full min-w-0 items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <span className="hidden md:inline">搜尋</span>
                <input
                  aria-label="搜尋書籤"
                  type="search"
                  placeholder="搜尋標題、摘要、網址"
                  className={fieldStyle + ' w-full min-w-0 flex-1'}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </label>
              <label className="flex shrink-0 items-center gap-2">
                <span className="hidden md:inline">排序</span>
                <select
                  className={fieldStyle + ' max-w-28 sm:max-w-none'}
                  aria-label="排序"
                  value={filters.sort}
                  onChange={(event) => select({ sort: event.target.value })}
                >
                  {sortOptions.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex w-full min-w-0 items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-1">
                <span className="shrink-0">由</span>
                <input
                  type="date"
                  aria-label="由日期（含當天）"
                  title="起始日期，包含當天"
                  min={bounds?.earliest}
                  max={filters.to || bounds?.latest}
                  className={fieldStyle + ' w-full min-w-0 flex-1 dark:[color-scheme:dark]'}
                  value={filters.from || bounds?.earliest || ''}
                  onChange={(event) => changeFrom(event.target.value)}
                />
              </label>
              <label className="flex min-w-0 flex-1 items-center gap-1">
                <span className="shrink-0">至</span>
                <input
                  type="date"
                  aria-label="至日期（含當天）"
                  title="結束日期，包含當天"
                  min={filters.from || bounds?.earliest}
                  max={bounds?.latest}
                  className={fieldStyle + ' w-full min-w-0 flex-1 dark:[color-scheme:dark]'}
                  value={filters.to || bounds?.latest || ''}
                  onChange={(event) => changeTo(event.target.value)}
                />
              </label>
            </div>
          </div>
          {error && (
            <p role="alert" className="py-3 text-red-500">
              {error}
            </p>
          )}
          {loading && (
            <p className="py-4 text-gray-500" role="status">
              載入書籤中…
            </p>
          )}
          {!loading && result.items.length === 0 && (
            <p className="py-6 text-gray-500">沒有符合條件的書籤。</p>
          )}
          {!loading &&
            result.items.map((item) => {
              const target = item.preferred_url || item.redirect_url || item.url
              const date = dateOnly(item.status_at || item.published_at || item.created_at)
              return (
                <article
                  key={item.id}
                  className="border-b border-gray-300/40 py-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <a
                      className="hover:text-primary-500 text-gray-500"
                      href={'/bookmarks/view/?id=' + encodeURIComponent(item.id)}
                      aria-label={date + ' · 書籤永久連結'}
                    >
                      <time dateTime={date}>{date}</time>
                    </a>
                    {item.status === 4 && <span className="text-primary-500">☆ 推薦</span>}
                  </div>
                  <h2 className="text-xl leading-snug font-bold">
                    <a
                      href={target}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {item.title}
                    </a>
                  </h2>
                  {item.title_original && item.title_original !== item.title && (
                    <p
                      lang="en"
                      className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-300"
                    >
                      {item.title_original}
                    </p>
                  )}
                  {item.summary && (
                    <div className="my-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                      <SafeMarkdown text={item.summary} />
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
                      const category = categories.find(
                        (tag) => tag.name.toLowerCase() === name.toLowerCase()
                      )
                      return (
                        <button
                          key={name}
                          onClick={() => changeTag(category?.id || name.toLowerCase())}
                          className="text-primary-500"
                        >
                          #{category?.name_zh || name}
                        </button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          {!loading && result.pages > 1 && (
            <nav aria-label="書籤分頁" className="mt-6 flex items-center justify-between">
              <button
                disabled={filters.page <= 1}
                onClick={() => select({ page: filters.page - 1 })}
              >
                ← 上一頁
              </button>
              <span className="text-sm">
                {result.page} / {result.pages}
              </span>
              <button
                disabled={filters.page >= result.pages}
                onClick={() => select({ page: filters.page + 1 })}
              >
                下一頁 →
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
