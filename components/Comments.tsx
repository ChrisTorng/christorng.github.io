'use client'

import Giscus from '@giscus/react'
import type { AvailableLanguage, BooleanString, Mapping, Repo, Theme } from '@giscus/react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'

export default function Comments() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pageContext, setPageContext] = useState({ title: '', url: '' })

  const comments = siteMetadata.comments
  const giscusConfig = comments?.provider === 'giscus' ? comments.giscusConfig : null
  const commentsTheme =
    resolvedTheme && giscusConfig
      ? giscusConfig.themeURL ||
        (resolvedTheme === 'dark' ? giscusConfig.darkTheme : giscusConfig.theme)
      : null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const siteTitleSuffix = ` | ${siteMetadata.title}`
    const pageTitle = document.title.endsWith(siteTitleSuffix)
      ? document.title.slice(0, -siteTitleSuffix.length)
      : document.title

    setPageContext({
      title: pageTitle,
      url: window.location.href,
    })
  }, [pathname])

  const emailHref = useMemo(() => {
    const subject = pageContext.title ? `回應「${pageContext.title}」` : '關於 ChrisTorng 學習天地'
    const body = [
      `我看了「${pageContext.title || '未知'} (${pageContext.url || '未知'})」，想回應：`,
    ].join('\n')

    return `mailto:contact@christorng.idv.tw?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [pageContext])

  if (!giscusConfig || !mounted || !commentsTheme) {
    return null
  }

  return (
    <section id="comment" className="pt-8 pb-8 text-gray-700 dark:text-gray-300">
      <Giscus
        key={pathname}
        id="comments-container"
        repo={giscusConfig.repo as Repo}
        repoId={giscusConfig.repositoryId}
        category={giscusConfig.category}
        categoryId={giscusConfig.categoryId}
        mapping={giscusConfig.mapping as Mapping}
        reactionsEnabled={giscusConfig.reactions as BooleanString}
        emitMetadata={giscusConfig.metadata as BooleanString}
        inputPosition={giscusConfig.inputPosition}
        theme={commentsTheme as Theme}
        lang={giscusConfig.lang as AvailableLanguage}
        loading="eager"
      />
      <p className="mt-4 text-sm leading-6">
        撰寫留言需要先登入 <a href="https://github.com">GitHub</a> 帳號。若無帳號或想私訊，可傳{' '}
        <a
          href={emailHref}
          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
        >
          Email
        </a>{' '}
        給我。
      </p>
    </section>
  )
}
