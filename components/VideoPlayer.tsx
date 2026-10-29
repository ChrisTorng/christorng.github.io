'use client'

import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/utils/media'

type VideoPlayerProps = {
  src: string
  title?: string
}

const basePath = process.env.BASE_PATH || ''

const VideoPlayer = ({ src, title }: VideoPlayerProps) => {
  const resolvedSrc = resolveMediaUrl(src, basePath)
  const [mounted, setMounted] = useState(false)

  // Fullscreen userscripts should only see media after React has hydrated this boundary.
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <figure className="my-6 flex justify-center">
      {mounted ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className="max-h-[80vh] w-full max-w-sm rounded-lg bg-black"
            controls
            preload="metadata"
            src={resolvedSrc}
            aria-label={title || '影片'}
          >
            <a href={resolvedSrc}>{title || src}</a>
          </video>
        </>
      ) : (
        <a className="aspect-video w-full max-w-sm" href={resolvedSrc}>
          觀看影片：{title || '影片'}
        </a>
      )}
    </figure>
  )
}

export default VideoPlayer
