'use client'

import { useMemo, useState } from 'react'
import Card from '@/components/Card'

interface ProjectListItem {
  title: string
  description: string
  href?: string
  demoHref?: string
  imgSrc?: string
  category: string
  updatedAt: string | null
}

type SortOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

export default function ProjectsExplorer({
  projects,
  categories,
}: {
  projects: ProjectListItem[]
  categories: string[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [order, setOrder] = useState<SortOrder>('newest')

  const visibleProjects = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase('zh-TW').split(/\s+/).filter(Boolean)
    const filtered = projects.filter((project) => {
      if (category && project.category !== category) return false
      if (!terms.length) return true
      const searchable = [
        project.title,
        project.description,
        project.category,
        project.href || '',
      ]
        .join(' ')
        .toLocaleLowerCase('zh-TW')
      return terms.every((term) => searchable.includes(term))
    })

    const byName = new Intl.Collator('zh-Hant', { numeric: true, sensitivity: 'base' })
    return filtered.sort((a, b) => {
      const nameComparison =
        byName.compare(a.title, b.title) || byName.compare(a.href || '', b.href || '')
      if (order === 'name-asc') return nameComparison
      if (order === 'name-desc') return -nameComparison
      // Unknown timestamps always sort last, even when sorting oldest first.
      if (!a.updatedAt && b.updatedAt) return 1
      if (a.updatedAt && !b.updatedAt) return -1
      const difference = (Date.parse(b.updatedAt || '') || 0) -
        (Date.parse(a.updatedAt || '') || 0)
      return (order === 'oldest' ? -difference : difference) || nameComparison
    })
  }, [projects, query, category, order])

  const hasFilters = Boolean(query || category || order !== 'newest')
  const reset = () => { setQuery(''); setCategory(''); setOrder('newest') }

  return (
    <section className="py-6 sm:py-8" aria-label="專案搜尋與清單">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_minmax(10rem,14rem)_auto]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="project-search" className="mb-1 block text-sm font-medium">
            搜尋專案
          </label>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋名稱、說明、分類或 Repo"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="project-category" className="mb-1 block text-sm font-medium">
            分類
          </label>
          <select
            id="project-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">全部分類</option>
            {categories.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="project-sort" className="mb-1 block text-sm font-medium">
            排序
          </label>
          <select
            id="project-sort"
            value={order}
            onChange={(event) => setOrder(event.target.value as SortOrder)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="newest">最後更新：新到舊</option>
            <option value="oldest">最後更新：舊到新</option>
            <option value="name-asc">名稱：A 到 Z</option>
            <option value="name-desc">名稱：Z 到 A</option>
          </select>
        </div>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={reset}
          className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          清除條件
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <p role="status" aria-live="polite">
          顯示 {visibleProjects.length}／{projects.length} 個專案
        </p>
        <p>更新日期依 GitHub Repo 最後推送時間，每日重新整理</p>
      </div>

      {visibleProjects.length ? (
        <div className="-mx-4 mt-4 flex flex-wrap">
          {visibleProjects.map((project) => (
            <Card
              key={project.href || project.title}
              title={project.title}
              description={project.description}
              imgSrc={project.imgSrc}
              href={project.href}
              demoHref={project.demoHref}
              category={project.category}
              updatedAt={project.updatedAt}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-600 dark:text-gray-400">
          <p>沒有符合條件的專案。</p>
          <button
            type="button"
            className="mt-3 text-primary-600 underline dark:text-primary-400"
            onClick={reset}
          >
            清除搜尋與篩選
          </button>
        </div>
      )}
    </section>
  )
}
