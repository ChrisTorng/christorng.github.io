'use client'

import { useEffect, useState } from 'react'
import SafeMarkdown from './SafeMarkdown'

type Note = {
  id: string
  title?: string | null
  bookmark_title?: string | null
  bookmark_id?: string | null
  markdown: string
  tags: string[]
  published_at?: string | null
  created_at: string
}
export default function NoteView() {
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id') || ''
    if (!/^[0-9]{8}-[a-f0-9]{10}$/.test(id)) {
      setError('隨筆 ID 無效')
      return
    }
    const controller = new AbortController()
    fetch('/notes/api/' + id, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('找不到隨筆')
        return (await response.json()) as Note
      })
      .then(setNote)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [])
  const title =
    note?.title ||
    note?.bookmark_title ||
    note?.markdown
      .split('\n')
      .find((x) => x.trim())
      ?.slice(0, 120) ||
    '隨筆'
  return (
    <section className="py-8">
      <a className="text-primary-500" href="/notes/">
        ← 隨筆列表
      </a>
      {error && (
        <p className="mt-6 text-red-500" role="alert">
          {error}
        </p>
      )}
      {!error && !note && <p className="mt-6 text-gray-500">載入中…</p>}
      {note && (
        <article className="mt-6">
          <time
            className="text-sm text-gray-500"
            dateTime={(note.published_at || note.created_at).slice(0, 10)}
          >
            {(note.published_at || note.created_at).slice(0, 10)}
          </time>
          <h1 className="my-5 text-3xl font-bold">{title}</h1>
          <SafeMarkdown text={note.markdown} />
          {note.bookmark_id && (
            <p className="mt-5">
              <a
                href={'/bookmarks/view/?id=' + encodeURIComponent(note.bookmark_id)}
                className="text-primary-500"
              >
                參考書籤 ↗
              </a>
            </p>
          )}
          <div className="mt-5 flex gap-3">
            {note.tags.map((tag) => (
              <a
                key={tag}
                className="text-primary-500"
                href={'/notes/?tag=' + encodeURIComponent(tag)}
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
