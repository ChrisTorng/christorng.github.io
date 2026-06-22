import { resolveMediaUrl } from '@/utils/media'

type AudioPlayerProps = {
  src: string
  title?: string
}

const basePath = process.env.BASE_PATH || ''

const AudioPlayer = ({ src, title }: AudioPlayerProps) => {
  const resolvedSrc = resolveMediaUrl(src, basePath)

  return (
    <figure className="my-4">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        className="w-full"
        controls
        preload="metadata"
        src={resolvedSrc}
        aria-label={title || '音訊'}
      >
        <a href={resolvedSrc}>{title || src}</a>
      </audio>
    </figure>
  )
}

export default AudioPlayer
