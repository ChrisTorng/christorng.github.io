'use client'

import { useEffect, useState } from 'react'
import NotePublicItem, {
  publicNoteTitle,
  type PublicNote,
  type NoteCategory,
} from './NotePublicItem'

export default function NoteView() {
  const [note, setNote] = useState<PublicNote | null>(null)
  const [categories, setCategories] = useState<NoteCategory[]>([])
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
        return (await response.json()) as PublicNote
      })
      .then(setNote)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    fetch('/notes/api/categories', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then(setCategories)
      .catch(() => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    if (note) document.title = publicNoteTitle(note) + ' | ChrisTorng 學習天地'
  }, [note])
  return (
    <section className="w-full py-5 pb-12">
      <a className="text-primary-500 text-sm" href="/notes/">
        ← 隨筆列表
      </a>
      {error && (
        <p className="mt-6 text-red-500" role="alert">
          {error}
        </p>
      )}
      {!error && !note && <p className="mt-6 text-gray-500">載入中…</p>}
      {note && (
        <div className="mt-4">
          <NotePublicItem note={note} categories={categories} detail />
        </div>
      )}
    </section>
  )
}
