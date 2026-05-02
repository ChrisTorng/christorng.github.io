type YouTubeEmbedProps = {
  id: string
  title: string
}

const YouTubeEmbed = ({ id, title }: YouTubeEmbedProps) => (
  <div className="my-6 aspect-video overflow-hidden rounded-lg">
    <iframe
      className="h-full w-full"
      src={`https://www.youtube.com/embed/${id}`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </div>
)

export default YouTubeEmbed
