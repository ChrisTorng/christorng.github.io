'use client'

import { useEffect, useState } from 'react'
import SafeMarkdown from './SafeMarkdown'

type Note = {
  id: string
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
const kinds = [
  { id: '', displayName: '所有隨筆' },
]
function noteTitle(note: Note) {
  return note.title || note.bookmark_title || note.markdown.split('\n').find((x) => x.trim())?.slice(0, 120) || '隨筆'
}
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
      if (path !== location.pathname + location.search) history.replaceState(history.state, '', path)
    }
    setBusy(true)
    fetch('/notes/api/' + (qs.size ? '?' + qs : ''), { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('隨筆載入失敗')
        return (await r.json()) as List
      })
      .then((data) => { setData(data); setMessage('') })
      .catch((error) => {
        if (!controller.signal.aborted) setMessage(error.message)
      })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [filter])
  const change = (next: { tag?: string; page?: number }) => {
    setFilter((previous) => ({ ...previous, ...next, page: next.page || 1 }))
  }
  const active = categories.find((category) => category.id === filter.tag)
  const feed = '/notes/feed.xml' + (filter.tag ? '?tag=' + encodeURIComponent(filter.tag) : '')
  return (
    <section className="w-full py-5 pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-accent text-3xl font-extrabold sm:text-5xl">隨筆 <small className="ml-2 text-lg font-normal text-gray-500">Notes</small></h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">個人隨筆、觀察與學習心得</p>
        </div>
        <a href={feed} type="application/rss+xml" className="inline-flex items-center gap-2 text-sm hover:text-primary-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
          </svg>
          {active ? active.displayName + ' · ' : ''}隨筆 RSS
        </a>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[244px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden rounded-xl border border-gray-200/70 bg-gray-100/60 p-4 md:block dark:border-gray-700/50 dark:bg-gray-800/70">
          {kinds.map((kind) => (
            <button key={kind.id} onClick={() => change({ tag: kind.id })} className={'w-full px-2 py-2 text-left font-bold ' + (!filter.tag ? 'text-primary-500' : '')}>{kind.displayName}</button>
          ))}
          <ul className="mt-2 border-t border-gray-300/40 pt-2 pl-3 dark:border-gray-700/60">
            {categories.map((category) => (
              <li key={category.id}>
                <button onClick={() => change({ tag: category.id })} className={'flex w-full justify-between rounded-md px-2 py-1.5 text-left text-sm ' + (filter.tag === category.id ? 'bg-blue-500/10 font-bold text-primary-500' : 'hover:text-primary-500')}>
                  <span>{category.displayName}</span><span className="opacity-60">{category.noteCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <label className="mb-4 block md:hidden">分類{' '}
            <select value={filter.tag} onChange={(e) => change({ tag: e.target.value })} className="rounded-md border bg-transparent px-2 py-1 dark:border-gray-700">
              <option value="">所有隨筆</option>
              {categories.map((cat) => <option value={cat.id} key={cat.id}>{cat.displayName}</option>)}
            </select>
          </label>
          {message && <p className="py-4 text-red-500" role="alert">{message}</p>}
          {busy && <p className="py-4 text-gray-500" role="status">載入隨筆中…</p>}
          {!busy && !data.items.length && <p className="py-4 text-gray-500">目前沒有隨筆。</p>}
          {!busy && data.items.map((note) => (
            <article key={note.id} className="border-b border-gray-300/40 py-4 dark:border-gray-700">
              <time className="text-xs text-gray-500" dateTime={(note.published_at || note.created_at).slice(0, 10)}>
                {(note.published_at || note.created_at).slice(0, 10)}
              </time>
              <h2 className="mt-2 text-xl font-bold">
                <a className="hover:text-primary-500" href={'/notes/view/?id=' + encodeURIComponent(note.id)}>{noteTitle(note)}</a>
              </h2>
              <div className="mt-3"><SafeMarkdown text={note.markdown} /></div>
              {note.bookmark_id && <a className="mt-3 inline-block text-sm text-primary-500" href={'/bookmarks/view/?id=' + note.bookmark_id}>參考書籤 ↗</a>}
              <div className="mt-3 flex flex-wrap gap-2">{note.tags.map((tag) => (
                <button key={tag} className="text-sm text-primary-500" onClick={() => change({ tag })}>#{categories.find((c) => c.id === tag)?.displayName || tag}</button>
              ))}</div>
            </article>
          ))}
          {!busy && data.pages > 1 && <nav className="mt-6 flex justify-between" aria-label="分頁">
            <button disabled={filter.page <= 1} onClick={() => change({ page: filter.page - 1 })}>← 上一頁</button>
            <span>{data.page} / {data.pages}</span>
            <button disabled={filter.page >= data.pages} onClick={() => change({ page: filter.page + 1 })}>下一頁 →</button>
          </nav>}
        </div>
      </div>
    </section>
  )
}
