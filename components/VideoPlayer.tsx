type VideoPlayerProps = {
  src: string
  title?: string
}

const VideoPlayer = ({ src, title }: VideoPlayerProps) => (
  <figure className="my-6 flex justify-center">
    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
    <video
      className="max-h-[80vh] w-full max-w-sm rounded-lg bg-black"
      controls
      preload="metadata"
      src={src}
      aria-label={title || 'Video'}
    >
      <a href={src}>{title || src}</a>
    </video>
  </figure>
)

export default VideoPlayer
