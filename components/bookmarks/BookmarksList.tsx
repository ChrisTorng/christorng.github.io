'use client'

import { useEffect, useState } from 'react'

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
type Filters = { tag: string; q: string; from: string; to: string; sort: string; page: number }
type Result = { items: Bookmark[]; total: number; page: number; pages: number }
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
  'rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-700'
export default function BookmarksList() {
  const [ready, setReady] = useState(false)
  const [filters, setFilters] = useState<Filters>(empty)
  const [searchText, setSearchText] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Result>({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
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
  function select(next: Partial<Filters>) {
    setFilters((old) => ({ ...old, ...next, page: next.page || 1 }))
  }
  function changeTag(tag: string) {
    select({ tag })
  }
  const active = categories.find((tag) => tag.id === filters.tag)
  const activeName = active?.name_zh || active?.name
  const rss = '/bookmarks/feed.xml' + (filters.tag ? '?tag=' + encodeURIComponent(filters.tag) : '')
  return (
    <section className="w-full py-5 pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-accent text-3xl font-extrabold sm:text-5xl">
            書籤 <small className="ml-2 text-lg font-normal text-gray-500">Bookmarks</small>
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">閱讀與分享的網頁收藏</p>
        </div>
        <a className="inline-flex items-center gap-2 text-sm hover:text-primary-500" href={rss} type="application/rss+xml">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          {activeName ? activeName + ' · ' : ''}書籤 RSS
        </a>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[244px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden rounded-xl border border-gray-200/70 bg-gray-100/60 p-4 md:block dark:border-gray-700/50 dark:bg-gray-800/70">
          <button onClick={() => changeTag('')} className={'w-full rounded-md px-2 py-2 text-left font-semibold ' + (!filters.tag ? 'text-primary-500' : '')}>
            所有書籤
          </button>
          <ul className="mt-2 border-t border-gray-300/40 pt-2 pl-3 dark:border-gray-700/60">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => changeTag(category.id)}
                  className={'flex w-full justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm ' + (filters.tag === category.id ? 'bg-blue-500/10 font-semibold text-primary-500' : 'hover:text-primary-500')}
                >
                  <span>{category.name_zh || category.name}</span>
                  <span className="opacity-60">{category.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-end gap-2 border-b border-gray-300/30 pb-4 text-sm dark:border-gray-700">
            <label className="md:hidden">
              <span className="mr-1">分類</span>
              <select className={fieldStyle} value={filters.tag} onChange={(event) => changeTag(event.target.value)}>
                <option value="">所有書籤</option>
                {categories.map((tag) => <option key={tag.id} value={tag.id}>{tag.name_zh || tag.name}</option>)}
              </select>
            </label>
            <label className="flex w-full items-center gap-2 sm:w-auto">
              <span>搜尋</span>
              <input aria-label="搜尋書籤" type="search" placeholder="標題、摘要、網址" className={fieldStyle + ' min-w-0 flex-1 sm:w-44'} value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            </label>
            <label className="flex items-center gap-1">起 <input type="date" aria-label="開始日期" className={fieldStyle + ' w-32'} value={filters.from} onChange={(event) => select({ from: event.target.value })} /></label>
            <label className="flex items-center gap-1">迄 <input type="date" aria-label="結束日期" className={fieldStyle + ' w-32'} value={filters.to} onChange={(event) => select({ to: event.target.value })} /></label>
            <label className="flex items-center gap-1">
              排序
              <select className={fieldStyle} aria-label="排序" value={filters.sort} onChange={(event) => select({ sort: event.target.value })}>
                {sortOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="py-3 text-red-500">{error}</p>}
          {loading && <p className="py-4 text-gray-500" role="status">載入書籤中…</p>}
          {!loading && result.items.length === 0 && <p className="py-6 text-gray-500">沒有符合條件的書籤。</p>}
          {!loading && result.items.map((item) => {
            const target = item.preferred_url || item.redirect_url || item.url
            const date = dateOnly(item.status_at || item.published_at || item.created_at)
            return (
              <article key={item.id} className="border-b border-gray-300/40 py-4 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl leading-snug font-bold">
                      <a href={target} target="_blank" rel="noopener noreferrer" className="hover:text-primary-500">{item.title} ↗</a>
                    </h2>
                    {item.title_original && item.title_original !== item.title && <p lang="en" className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">{item.title_original}</p>}
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-500">
                    <time dateTime={date}>{date}</time>
                    {item.status === 4 && <div className="mt-1 text-primary-500">☆ 推薦</div>}
                  </div>
                </div>
                {item.summary && <p className="my-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.summary}</p>}
                {target !== item.url && <p className="mb-1 break-all text-xs text-gray-500">原始網址：<a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">{item.url}</a></p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {item.tags.map((name) => {
                    const category = categories.find((tag) => tag.name.toLowerCase() === name.toLowerCase())
                    return <button key={name} onClick={() => changeTag(category?.id || name.toLowerCase())} className="text-primary-500">#{category?.name_zh || name}</button>
                  })}
                  <a className="ml-auto text-xs text-gray-500 hover:text-primary-500" href={'/bookmarks/view/?id=' + encodeURIComponent(item.id)}>書籤詳情</a>
                </div>
              </article>
            )
          })}
          {!loading && result.pages > 1 && (
            <nav aria-label="書籤分頁" className="mt-6 flex items-center justify-between">
              <button disabled={filters.page <= 1} onClick={() => select({ page: filters.page - 1 })}>← 上一頁</button>
              <span className="text-sm">{result.page} / {result.pages}</span>
              <button disabled={filters.page >= result.pages} onClick={() => select({ page: filters.page + 1 })}>下一頁 →</button>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
