import { components } from '@/components/MDXComponents'
import { genPageMetadata } from 'app/seo'
import { allAuthors } from 'contentlayer/generated'
import type { Authors } from 'contentlayer/generated'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXLayoutRenderer } from 'pliny/mdx-components'

export function generateStaticParams() {
  return allAuthors
    .filter((author) => author.slug !== 'default')
    .map((author) => ({
      slug: author.slug,
    }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata | undefined> {
  const { slug } = await props.params
  const author = allAuthors.find((author) => author.slug === decodeURI(slug))

  if (!author) {
    return
  }

  return genPageMetadata({ title: author.name })
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const author = allAuthors.find((author) => author.slug === decodeURI(slug)) as Authors | undefined

  if (!author || author.slug === 'default') {
    return notFound()
  }

  const isFullWidth = author.layout === 'FullWidth'

  return (
    <article
      className={`prose dark:prose-invert max-w-none pt-8 pb-8 ${isFullWidth ? 'full-width-page' : ''}`}
    >
      <MDXLayoutRenderer code={author.body.code} components={components} toc={author.toc} />
    </article>
  )
}
