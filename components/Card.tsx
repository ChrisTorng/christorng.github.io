import Image from './Image'
import Link from './Link'
import type { ReactNode } from 'react'

const ExternalLinkIcon = () => (
  <svg aria-hidden="true" className="ml-1 h-4 w-4 flex-none" viewBox="0 0 20 20" fill="none">
    <path
      d="M7.5 5.5H5.75A2.25 2.25 0 0 0 3.5 7.75v6.5a2.25 2.25 0 0 0 2.25 2.25h6.5a2.25 2.25 0 0 0 2.25-2.25V12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 3.5h6m0 0v6m0-6-7.5 7.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface CardLinkProps {
  href: string
  ariaLabel: string
  children: ReactNode
  className?: string
}

const CardLink = ({ href, ariaLabel, children, className }: CardLinkProps) => (
  <Link
    href={href}
    className={`text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 decoration-primary-500/40 hover:decoration-primary-600 dark:decoration-primary-400/40 dark:hover:decoration-primary-400 inline-flex items-center leading-6 font-medium underline underline-offset-4 transition-colors ${className ?? ''}`}
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
            >
              {title}
            </CardLink>
          ) : (
            title
          )}
        </h2>
        <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">{description}</p>
        {href && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <CardLink href={href} ariaLabel={`前往 ${title}`}>
              前往了解
            </CardLink>
            {demoHref && (
              <CardLink href={demoHref} ariaLabel={`開啟 ${title} 線上展示`} className="shrink-0">
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
