'use client'

import { useEffect, useState } from 'react'
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
  tags: string[]
  status: number
  status_at?: string | null
  published_at?: string | null
  created_at: string
}

const statusLabel: Record<number, string> = {
  0: '未讀',
  1: '已讀 · 待決定',
  2: '不公開',
  3: '已公開',
  4: '☆ 推薦',
  5: '稍後再決定',
}

export default function BookmarkView() {
  const [item, setItem] = useState<Bookmark | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id') || ''
    if (!/^[0-9a-f-]{36}$/.test(id)) {
      setError('書籤 ID 無效')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      const publicUrl = '/bookmarks/api/' + encodeURIComponent(id)
      const publicResponse = await fetch(publicUrl, {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (publicResponse.ok) return (await publicResponse.json()) as Bookmark
      if (publicResponse.status !== 404) throw Error('書籤無法載入')

      // Private previews require an authenticated administrator. A UUID alone grants no access.
      const adminResponse = await fetch('/bookmarks/api/admin/' + encodeURIComponent(id), {
        signal: controller.signal,
        credentials: 'same-origin',
        cache: 'no-store',
        headers:
          ['localhost', '127.0.0.1'].includes(location.hostname) &&
          sessionStorage.getItem('blog-bookmarks-admin-token')
            ? { Authorization: 'Bearer ' + sessionStorage.getItem('blog-bookmarks-admin-token') }
            : {},
      })
      if (adminResponse.status === 401 || adminResponse.status === 403) {
        throw Error('此書籤尚未公開，需以管理員身分登入才能預覽')
      }
      if (!adminResponse.ok) throw Error('找不到書籤')
      return (await adminResponse.json()) as Bookmark
    }

    load()
      .then(setItem)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (item) document.title = item.title + ' | ChrisTorng 學習天地'
  }, [item])

  const target = item?.preferred_url || item?.redirect_url || item?.url
  const date = (item?.status_at || item?.published_at || item?.created_at || '').slice(0, 10)

  return (
    <section className="py-8">
      <a className="text-primary-500" href="/bookmarks/">
        ← 書籤列表
      </a>
      {error && (
        <p role="alert" className="mt-6 text-red-500">
          {error}
        </p>
      )}
      {!error && !item && <p className="mt-6 text-gray-500">載入中…</p>}
      {item && (
        <article className="mt-8 border-b border-gray-300/40 pb-6 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <time dateTime={date} className="text-gray-500">
              {date}
            </time>
            <span className={item.status === 4 ? 'text-primary-500' : 'text-gray-500'}>
              {statusLabel[item.status] || '未公開'}
            </span>
          </div>
          <h1 className="text-2xl leading-snug font-bold sm:text-3xl">
            <a
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              href={target}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
          </h1>
          {item.title_original && item.title_original !== item.title && (
            <p lang="en" className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">
              {item.title_original}
            </p>
          )}
          {item.summary && (
            <div className="my-6 text-gray-700 dark:text-gray-200">
              <SafeMarkdown text={item.summary} />
            </div>
          )}
          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <a href={target} target="_blank" rel="noopener noreferrer" className="text-primary-500">
              前往網站
            </a>
            <BookmarkSource url={item.url} />
          </div>
          {target !== item.url && (
            <p className="mt-2 text-sm break-all text-gray-600 dark:text-gray-300">
              原始網址：
              <a className="underline" href={item.url} target="_blank" rel="noopener noreferrer">
                {item.url}
              </a>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {item.tags.map((tag) => (
              <a
                key={tag}
                className="text-primary-500"
                href={'/bookmarks/?tag=' + encodeURIComponent(tag.toLowerCase())}
              >
                #{tag}
              </a>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}
