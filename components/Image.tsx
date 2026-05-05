import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const hasProtocol = (src: string) => /^[a-z][a-z\d+\-.]*:/i.test(src)

const isGif = (src: string) => src.split(/[?#]/)[0].toLowerCase().endsWith('.gif')

const Image = ({ src, unoptimized, ...rest }: ImageProps) => {
  const resolvedSrc = typeof src === 'string' && !hasProtocol(src) ? `${basePath || ''}${src}` : src

  return (
    <NextImage
      src={resolvedSrc}
      unoptimized={unoptimized || (typeof src === 'string' && isGif(src))}
      {...rest}
    />
  )
}

export default Image
