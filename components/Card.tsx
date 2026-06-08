import Image from './Image'
import Link from './Link'
import ExternalLinkIcon from './ExternalLinkIcon'
import type { ReactNode } from 'react'

interface CardLinkProps {
  href: string
  ariaLabel: string
  children: ReactNode
  className?: string
  variant?: 'accent' | 'primary'
}

const cardLinkVariants = {
  accent:
    'text-accent-700 hover:text-accent-800 dark:text-accent-500 dark:hover:text-accent-300 decoration-accent-500/40 hover:decoration-accent-700 dark:decoration-accent-500/50 dark:hover:decoration-accent-300',
  primary:
    'text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 decoration-primary-500/40 hover:decoration-primary-600 dark:decoration-primary-400/40 dark:hover:decoration-primary-400',
}

const CardLink = ({ href, ariaLabel, children, className, variant = 'primary' }: CardLinkProps) => (
  <Link
    href={href}
    className={`${cardLinkVariants[variant]} inline-flex items-center leading-6 font-medium underline underline-offset-4 transition-colors ${className ?? ''}`}
    aria-label={ariaLabel}
  >
    <span>{children}</span>
    <ExternalLinkIcon />
  </Link>
)

const Card = ({ title, description, imgSrc, href, demoHref }) => (
  <div className="md max-w-[544px] p-4 md:w-1/2">
    <div
      className={`${
        imgSrc && 'h-full'
      } overflow-hidden rounded-md border-2 border-gray-200/60 dark:border-gray-700/60`}
    >
      {imgSrc &&
        (href ? (
          <Link href={href} aria-label={`前往 ${title}`}>
            <Image
              alt={title}
              src={imgSrc}
              className="object-cover object-center md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <Image
            alt={title}
            src={imgSrc}
            className="object-cover object-center md:h-36 lg:h-48"
            width={544}
            height={306}
          />
        ))}
      <div className="p-6">
        <h2 className="mb-3 text-2xl leading-8 font-bold tracking-tight">
          {href ? (
            <CardLink
              href={href}
              ariaLabel={`前往 ${title}`}
              className="text-2xl leading-8 font-bold"
              variant="accent"
            >
              {title}
            </CardLink>
          ) : (
            <span className="text-accent-700 dark:text-accent-500">{title}</span>
          )}
        </h2>
        <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">{description}</p>
        {href && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <CardLink href={href} ariaLabel={`前往 ${title}`}>
              前往了解
            </CardLink>
            {demoHref && (
              <CardLink
                href={demoHref}
                ariaLabel={`開啟 ${title} 線上展示`}
                className="shrink-0"
                variant="accent"
              >
                線上展示
              </CardLink>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)

export default Card
