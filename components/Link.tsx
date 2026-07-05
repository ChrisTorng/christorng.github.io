/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'

const CustomLink = ({
  href,
  className,
  ...rest
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith('/')
  const isAnchorLink = href && href.startsWith('#')
  const linkClassName = ['break-words', className].filter(Boolean).join(' ')

  if (isInternalLink) {
    return <Link className={linkClassName} href={href} {...rest} />
  }

  if (isAnchorLink) {
    return <a className={linkClassName} href={href} {...rest} />
  }

  return (
    <a className={linkClassName} target="_blank" rel="noopener noreferrer" href={href} {...rest} />
  )
}

export default CustomLink
