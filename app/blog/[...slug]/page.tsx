import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { findBlogBySlug, getDraftBlogs, getLegacyPostSlug, getPublishedBlogs } from 'app/blog-utils'
import { resolveImageUrl } from '@/utils/responsiveImages'
import Link from '@/components/Link'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

function LegacyRedirect({ destination, title }: { destination: string; title: string }) {
  const redirectScript = `window.location.replace(${JSON.stringify(destination)})`

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <PageTitle>文章網址已更新</PageTitle>
      <p className="mt-8 text-lg text-gray-600 dark:text-gray-300">
        正在前往{' '}
        <Link href={destination} className="text-primary-500 hover:text-primary-600">
          {title}
        </Link>
        。
      </p>
    </main>
  )
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const match = findBlogBySlug(allBlogs, slug)
  const post = match?.post
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img && img.includes('http') ? img : resolveImageUrl(img, siteMetadata.siteUrl),
    }
  })

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: match?.isLegacySlug ? `/blog/${post.slug}/` : './',
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: match?.isLegacySlug ? `/blog/${post.slug}/` : './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList.map((img) =>
        img && img.includes('http') ? img : resolveImageUrl(img, siteMetadata.siteUrl)
      ),
    },
    robots: post.draft ? { index: false, follow: false } : undefined,
  }
}

export const generateStaticParams = async () => {
  return allBlogs.flatMap((post) => {
    const legacySlug = getLegacyPostSlug(post.slug)
    const slugs = legacySlug ? [post.slug, legacySlug] : [post.slug]
    return [...new Set(slugs)].map((slug) => ({
      slug: slug.split('/').map((name) => decodeURI(name)),
    }))
  })
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const match = findBlogBySlug(allBlogs, slug)
  if (!match) {
    return notFound()
  }
  if (match.isLegacySlug) {
    const destination = `/blog/${match.post.slug}/`
    return <LegacyRedirect destination={destination} title={match.post.title} />
  }
  const post = match.post as Blog

  const navigationBlogs = post.draft ? getDraftBlogs(allBlogs) : getPublishedBlogs(allBlogs)
  const sortedCoreContents = sortPosts(navigationBlogs).map((post) => coreContent(post))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  const mainContent = coreContent(post)
  const jsonLd = post.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  const Layout = layouts[post.layout || defaultLayout]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
        <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
      </Layout>
    </>
  )
}
