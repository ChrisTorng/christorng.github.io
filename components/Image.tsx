import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const hasProtocol = (src: string) => /^[a-z][a-z\d+\-.]*:/i.test(src)

const Image = ({ src, ...rest }: ImageProps) => (
  <NextImage
    src={typeof src === 'string' && !hasProtocol(src) ? `${basePath || ''}${src}` : src}
    {...rest}
  />
)

export default Image
