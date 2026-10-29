'use client'

import { useEffect, useState } from 'react'

type YouTubeEmbedProps = {
  id: string
  title: string
}

const YouTubeEmbed = ({ id, title }: YouTubeEmbedProps) => {
  const [mounted, setMounted] = useState(false)

  // Insert media after hydration so media userscripts cannot mutate SSR markup first.
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="my-6 aspect-video overflow-hidden rounded-lg">
      {mounted ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <a href={`https://www.youtube.com/watch?v=${id}`}>在 YouTube 觀看：{title}</a>
      )}
    </div>
  )
}

export default YouTubeEmbed
