import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Image from 'next/image'
import Link from './Link'
import MobileNav from './MobileNavWrapper'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'

const Header = () => {
  let headerClass = 'flex items-center w-full bg-gray-50 dark:bg-gray-900 justify-between py-10'
  const headerTitle =
    typeof siteMetadata.headerTitle === 'string' ? siteMetadata.headerTitle.split(' ') : []

  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50'
  }

  return (
    <header className={headerClass}>
      <Link href="/" aria-label={siteMetadata.headerTitle} className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center">
          <div className="mr-2 shrink-0 sm:mr-3">
            <Image
              src={siteMetadata.siteLogo}
              alt=""
              width={54}
              height={44}
              className="h-11 w-14 object-contain"
              priority
            />
          </div>
          {typeof siteMetadata.headerTitle === 'string' ? (
            <div className="heading-accent flex max-h-11 min-w-0 flex-wrap gap-x-1 overflow-hidden text-sm leading-5 font-semibold sm:h-6 sm:flex-nowrap sm:text-2xl sm:leading-6">
              {headerTitle.map((part) => (
                <span key={part} className="whitespace-nowrap">
                  {part}
                </span>
              ))}
            </div>
          ) : (
            siteMetadata.headerTitle
          )}
        </div>
      </Link>
      <div className="flex shrink-0 items-center space-x-2 leading-5 sm:-mr-6 sm:space-x-6">
        <div className="no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-700 dark:text-gray-300"
              >
                {link.title}
              </Link>
            ))}
        </div>
        <SearchButton />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
