import { resolveMediaUrl } from '@/utils/media'

type VideoPlayerProps = {
  src: string
  title?: string
}

const basePath = process.env.BASE_PATH || ''

const VideoPlayer = ({ src, title }: VideoPlayerProps) => {
  const resolvedSrc = resolveMediaUrl(src, basePath)

  return (
    <figure className="my-6 flex justify-center">
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
    </figure>
  )
}

export default VideoPlayer
