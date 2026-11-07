'use client'

import { useEffect, useState } from 'react'
import BookmarkPublicItem, {
  type BookmarkCategory,
  type PublicBookmark,
} from '@/components/bookmarks/BookmarkPublicItem'

export default function BookmarkView() {
  const [item, setItem] = useState<PublicBookmark | null>(null)
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id') || ''
    if (!/^[0-9a-f-]{36}$/.test(id)) {
      setError('書籤 ID 無效')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      const publicResponse = await fetch('/bookmarks/api/' + encodeURIComponent(id), {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (publicResponse.ok) return (await publicResponse.json()) as PublicBookmark
      if (publicResponse.status !== 404) throw Error('書籤無法載入')

      // Private previews still require authenticated administration.
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
      return (await adminResponse.json()) as PublicBookmark
    }
    load()
      .then(setItem)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    fetch('/bookmarks/api/tags', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then(setCategories)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (item) document.title = item.title + ' | ChrisTorng 學習天地'
  }, [item])

  return (
    <section className="w-full py-5 pb-12">
      <a className="text-primary-500 text-sm" href="/bookmarks/">
        ← 書籤列表
      </a>
      {error && (
        <p role="alert" className="mt-6 text-red-500">
          {error}
        </p>
      )}
      {!error && !item && <p className="mt-6 text-gray-500">載入中…</p>}
      {item && (
        <div className="mt-4">
          <BookmarkPublicItem item={item} categories={categories} detail />
        </div>
      )}
    </section>
  )
}
