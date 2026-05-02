type AudioPlayerProps = {
  src: string
  title?: string
}

const AudioPlayer = ({ src, title }: AudioPlayerProps) => (
  <figure className="my-4">
    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
    <audio className="w-full" controls preload="metadata" src={src} aria-label={title || 'Audio'}>
      <a href={src}>{title || src}</a>
    </audio>
  </figure>
)

export default AudioPlayer
