import 'css/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'

import { Space_Grotesk } from 'next/font/google'
import { Analytics, AnalyticsConfig } from 'pliny/analytics'
import { SearchProvider, SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import ExternalLinkHandler from '@/components/ExternalLinkHandler'
import Comments from '@/components/Comments'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { Metadata } from 'next'

const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: 'summary_large_image',
    images: [siteMetadata.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''
  const faviconPath = `${basePath}/static/favicons/favicon.ico`
  const logoPath = `${basePath}/static/images/logo.png`

  return (
    <html
      lang={siteMetadata.language}
      className={`${space_grotesk.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <link rel="apple-touch-icon" href={logoPath} />
      <link rel="icon" type="image/x-icon" href={faviconPath} />
      <meta name="darkreader-lock" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9fafb" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111827" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body className="overflow-x-hidden bg-gray-50 pl-[calc(100vw-100%)] text-gray-800 antialiased dark:bg-gray-900 dark:text-gray-200">
        <ExternalLinkHandler />
        <ThemeProviders>
          <ScrollTopAndComment />
          {siteMetadata.analytics && (
            <Analytics analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
          )}
          <SectionContainer>
            <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
              <Header />
              <main className="mb-auto">{children}</main>
            </SearchProvider>
            <span id="留言" className="block scroll-mt-24" aria-hidden="true" />
            <Comments />
            <Footer />
          </SectionContainer>
        </ThemeProviders>
      </body>
    </html>
  )
}
