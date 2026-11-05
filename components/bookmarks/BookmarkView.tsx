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
  tags: string[]
  status: number
  status_at?: string | null
  published_at?: string | null
  created_at: string
}
export default function BookmarkView() {
  const [item, setItem] = useState<Bookmark | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id') || ''
    if (!/^[0-9a-f-]{36}$/.test(id)) { setError('書籤 ID 無效'); return }
    const controller = new AbortController()
    fetch('/bookmarks/api/' + encodeURIComponent(id), { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error('找不到書籤')
        return (await r.json()) as Bookmark
      })
      .then(setItem)
      .catch((e) => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [])
  const target = item?.preferred_url || item?.redirect_url || item?.url
  const date = (item?.status_at || item?.published_at || item?.created_at || '').slice(0, 10)
  return (
    <section className="py-8">
      <a className="text-primary-500" href="/bookmarks/">← 書籤列表</a>
      {error && <p role="alert" className="mt-6 text-red-500">{error}</p>}
      {!error && !item && <p className="mt-6 text-gray-500">載入中…</p>}
      {item && <article className="mt-8">
        <time dateTime={date} className="text-sm text-gray-500">{date}</time>
        {item.status === 4 && <span className="ml-3 text-primary-500">☆ 推薦</span>}
        <h1 className="mt-3 text-3xl font-bold">{item.title}</h1>
        {item.title_original && item.title_original !== item.title && <p className="mt-2 text-gray-500">{item.title_original}</p>}
        <p className="mt-5 break-all"><a className="text-primary-500" href={target} target="_blank" rel="noopener noreferrer">前往網站 ↗</a></p>
        {target !== item.url && <p className="mt-2 break-all text-sm text-gray-500">原始網址：<a className="underline" href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></p>}
        {item.summary && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-500">{item.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-3">{item.tags.map((tag) => <a key={tag} className="text-primary-500" href={'/bookmarks/?tag=' + encodeURIComponent(tag.toLowerCase())}>#{tag}</a>)}</div>
      </article>}
    </section>
  )
}
