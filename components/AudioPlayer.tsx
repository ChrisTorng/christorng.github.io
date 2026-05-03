type AudioPlayerProps = {
  src: string
  title?: string
}

const basePath = process.env.BASE_PATH || ''

const withBasePath = (src: string) => (src.startsWith('/') ? `${basePath}${src}` : src)

const AudioPlayer = ({ src, title }: AudioPlayerProps) => (
  <figure className="my-4">
    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
    <audio
      className="w-full"
      controls
      preload="metadata"
      src={withBasePath(src)}
      aria-label={title || 'Audio'}
    >
      <a href={withBasePath(src)}>{title || src}</a>
    </audio>
  </figure>
)

export default AudioPlayer
