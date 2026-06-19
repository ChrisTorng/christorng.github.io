import NextImage, { ImageProps } from 'next/image'
import { getResponsiveImageFallback, getResponsiveImageSources } from '@/utils/responsiveImages'
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
  alt,
  ...rest
}: ImageProps) => {
  const resolvedSrc = typeof src === 'string' && !hasProtocol(src) ? `${basePath || ''}${src}` : src
  const responsiveSources =
    typeof src === 'string' && !isGif(src) ? getResponsiveImageSources(src, basePath || '') : []
  const responsiveFallback =
    typeof src === 'string' && !isGif(src)
      ? getResponsiveImageFallback(src, basePath || '')
      : undefined
  const responsiveSizes =
    sizes ||
    (fill
      ? '100vw'
      : typeof width === 'number' && width <= 320
        ? `${width}px`
        : '(max-width: 768px) 100vw, 768px')

  if (typeof resolvedSrc === 'string' && responsiveFallback && responsiveSources.length > 0) {
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
      <picture>
        {responsiveSources.map((source) => (
          <source
            key={source.type}
            type={source.type}
            srcSet={source.srcSet}
            sizes={responsiveSizes}
          />
        ))}
        <img
          src={responsiveFallback.src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          loading={priority ? 'eager' : loading || 'lazy'}
          decoding="async"
          style={{ ...fillStyle, ...style }}
          {...rest}
        />
      </picture>
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
      alt={alt}
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
