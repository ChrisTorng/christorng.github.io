'use client'

import { useEffect, useState } from 'react'

// All public note references use the same canonical HTML as the Workers and RSS.
// A list never requests the long reading summary; a detail page may request it.
export default function BookmarkInline({
  id,
  showReading = false,
}: {
  id: string
  showReading?: boolean
}) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setHtml('')
    setError('')
    const url = '/bookmarks/api/embed/' + encodeURIComponent(id) + (showReading ? '' : '?reading=0')
    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) throw new Error('引用書籤目前未公開或已移除。')
        if (!response.ok) throw new Error('暫時無法載入引用書籤。')
        if (!response.headers.get('content-type')?.includes('text/html'))
          throw new Error('引用書籤格式錯誤。')
        const content = await response.text()
        if (!controller.signal.aborted) setHtml(content)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message || '引用書籤載入失敗。')
      })
    return () => controller.abort()
  }, [id, showReading])

  return (
    <aside
      aria-label="引用書籤"
      className="border-primary-500 mt-3 min-w-0 rounded-r-lg border-l-4 bg-gray-50/60 px-3 py-2 dark:bg-gray-800/40"
    >
      <hr />
      <p>
        <strong>引用書籤</strong>
      </p>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p role="status" className="text-sm text-gray-500">
          {error || '正在載入引用書籤……'}
        </p>
      )}
    </aside>
  )
}
