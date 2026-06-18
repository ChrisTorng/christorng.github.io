/* eslint-disable @next/next/no-img-element -- responsive variants are generated outside Next Image */
import NextImage, { ImageProps } from 'next/image'
import { getResponsiveImageSrcSet } from '@/utils/responsiveImages'
import type { CSSProperties } from 'react'

const basePath = process.env.BASE_PATH

const hasProtocol = (src: string) => /^[a-z][a-z\d+\-.]*:/i.test(src)

const isGif = (src: string) => src.split(/[?#]/)[0].toLowerCase().endsWith('.gif')

const Image = ({
  src,
  unoptimized,
  fill,
  width,
  height,
  sizes,
  priority,
  loading,
  placeholder,
  blurDataURL,
  quality,
  loader,
  onLoadingComplete,
  overrideSrc,
  objectFit,
  objectPosition,
  layout,
  lazyBoundary,
  lazyRoot,
  style,
  ...rest
}: ImageProps) => {
  const resolvedSrc = typeof src === 'string' && !hasProtocol(src) ? `${basePath || ''}${src}` : src
  const srcSet =
    typeof src === 'string' && !isGif(src)
      ? getResponsiveImageSrcSet(src, basePath || '')
      : undefined

  if (typeof resolvedSrc === 'string' && srcSet) {
    const fillStyle: CSSProperties | undefined = fill
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          color: 'transparent',
        }
      : undefined

    return (
      <img
        src={resolvedSrc}
        srcSet={srcSet}
        sizes={sizes || (fill ? '100vw' : '(max-width: 768px) 100vw, 768px')}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? 'eager' : loading || 'lazy'}
        decoding="async"
        style={{ ...fillStyle, ...style }}
        {...rest}
      />
    )
  }

  return (
    <NextImage
      src={resolvedSrc}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={unoptimized ?? true}
      priority={priority}
      loading={loading}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      quality={quality}
      loader={loader}
      onLoadingComplete={onLoadingComplete}
      overrideSrc={overrideSrc}
      objectFit={objectFit}
      objectPosition={objectPosition}
      layout={layout}
      lazyBoundary={lazyBoundary}
      lazyRoot={lazyRoot}
      style={style}
      {...rest}
    />
  )
}

export default Image
