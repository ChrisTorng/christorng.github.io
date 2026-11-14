'use client'

import { useEffect, useState } from 'react'
import BookmarkPublicItem, {
  type PublicBookmark,
  type BookmarkCategory,
} from '@/components/bookmarks/BookmarkPublicItem'

// Render a reference to the current Bookmarks API record, never a snapshot
// copied into the Note. The same component powers public bookmark cards.
export default function BookmarkInline({ id }: { id: string }) {
  const [item, setItem] = useState<PublicBookmark | null>(null)
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setItem(null)
    setError('')
    async function load() {
      const response = await fetch('/bookmarks/api/' + encodeURIComponent(id), {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (response.status === 404) {
        setError('引用書籤目前未公開或已移除。')
        return
      }
      if (!response.ok) throw new Error('暫時無法載入引用書籤。')
      const record = (await response.json()) as PublicBookmark
      if (controller.signal.aborted) return
      setItem(record)
      try {
        const tags = await fetch('/bookmarks/api/tags', { signal: controller.signal })
        if (tags.ok && !controller.signal.aborted)
          setCategories((await tags.json()) as BookmarkCategory[])
      } catch (error) {
        if (controller.signal.aborted) return
        // Bookmarks still render even when localized tag labels are unavailable.
      }
    }
    load().catch((error) => {
      if (!controller.signal.aborted) setError(error.message || '引用書籤載入失敗。')
    })
    return () => controller.abort()
  }, [id])

  return (
    <aside aria-label="引用書籤"
      className="mt-3 min-w-0 rounded-r-lg border-l-4 border-primary-500 bg-gray-50/60 px-3 py-2 dark:bg-gray-800/40">
      {item ? <BookmarkPublicItem item={item} categories={categories} /> :
        <p role="status" className="text-sm text-gray-500">
          {error || '正在載入引用書籤……'}
        </p>}
    </aside>
  )
}
