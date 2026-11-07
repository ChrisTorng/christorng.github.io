'use client'

import { useEffect, useState } from 'react'
import NotePublicItem from './NotePublicItem'
import MobileCategorySelect from '@/components/MobileCategorySelect'
import PublicCategorySidebar from '@/components/PublicCategorySidebar'

type Note = {
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
type Category = { id: string; displayName: string; noteCount: number }
type List = { items: Note[]; pages: number; page: number; total: number }
export default function NotesList() {
  const [filter, setFilter] = useState({ tag: '', page: 1 })
  const [categories, setCategories] = useState<Category[]>([])
  const [data, setData] = useState<List>({ items: [], pages: 1, page: 1, total: 0 })
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const update = () => {
      const p = new URLSearchParams(location.search)
      const page = Math.max(1, Number(p.get('page')) || 1)
      setFilter({ tag: p.get('tag') || '', page })
    }
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/notes/api/categories', { signal: controller.signal })
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const qs = new URLSearchParams()
    if (filter.tag) qs.set('tag', filter.tag)
    if (filter.page > 1) qs.set('page', String(filter.page))
    if (location.pathname === '/notes/') {
      const path = '/notes/' + (qs.size ? '?' + qs.toString() : '')
      if (path !== location.pathname + location.search)
        history.replaceState(history.state, '', path)
    }
    setBusy(true)
    fetch('/notes/api/' + (qs.size ? '?' + qs : ''), {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('隨筆載入失敗')
        return (await r.json()) as List
      })
      .then((data) => {
        setData(data)
        setMessage('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false)
      })
    return () => controller.abort()
  }, [filter])
  const change = (next: { tag?: string; page?: number }) => {
    setFilter((previous) => ({ ...previous, ...next, page: next.page || 1 }))
  }
  const active = categories.find((category) => category.id === filter.tag)
  useEffect(() => {
    document.title = (active ? active.displayName + ' · 隨筆' : '隨筆') + ' | ChrisTorng 學習天地'
  }, [active])
  const feed = '/notes/feed.xml' + (filter.tag ? '?tag=' + encodeURIComponent(filter.tag) : '')
  return (
    <section className="w-full py-5 pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-accent text-3xl font-extrabold sm:text-5xl">
            {active ? active.displayName + ' · 隨筆' : '隨筆'}{' '}
            <small className="ml-2 text-lg font-normal text-gray-500">Notes</small>
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">個人隨筆、觀察與學習心得</p>
        </div>
        <a
          href={feed}
          type="application/rss+xml"
          className="hover:text-primary-500 inline-flex items-center gap-2 text-sm"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          {active ? active.displayName + ' · 隨筆 RSS' : '所有隨筆 RSS'}
        </a>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[244px_minmax(0,1fr)] lg:gap-12">
        <PublicCategorySidebar
          rootLabel="所有隨筆"
          activeTag={filter.tag}
          categories={categories.map((category) => ({
            id: category.id,
            label: category.displayName,
            count: category.noteCount,
          }))}
          onChange={(tag) => change({ tag })}
        />
        <div className="min-w-0">
          <MobileCategorySelect
            value={filter.tag}
            options={[
              { value: '', label: '所有隨筆' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.displayName,
              })),
            ]}
            onChange={(tag) => change({ tag })}
          />
          {message && (
            <p className="py-4 text-red-500" role="alert">
              {message}
            </p>
          )}
          {busy && (
            <p className="py-4 text-gray-500" role="status">
              載入隨筆中…
            </p>
          )}
          {!busy && !data.items.length && <p className="py-4 text-gray-500">目前沒有隨筆。</p>}
          {!busy &&
            data.items.map((note) => (
              <NotePublicItem
                key={note.id}
                note={note}
                categories={categories}
                onTagChange={(tag) => change({ tag })}
              />
            ))}
          {!busy && data.pages > 1 && (
            <nav className="mt-6 flex justify-between" aria-label="分頁">
              <button disabled={filter.page <= 1} onClick={() => change({ page: filter.page - 1 })}>
                ← 上一頁
              </button>
              <span>
                {data.page} / {data.pages}
              </span>
              <button
                disabled={filter.page >= data.pages}
                onClick={() => change({ page: filter.page + 1 })}
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
