import type { ElementType } from 'react'

export type PublicCategory = {
  id: string
  label: string
  count?: number
  href?: string
}

type Props = {
  rootLabel: string
  rootHref?: string
  activeTag?: string
  categories: PublicCategory[]
  onChange?: (id: string) => void
  LinkComponent?: ElementType
}

/**
 * The main site owns the public category sidebar design for Articles, Notes and
 * Bookmarks. Mobile navigation uses MobileCategorySelect alongside this component.
 */
export default function PublicCategorySidebar({
  rootLabel,
  rootHref,
  activeTag = '',
  categories,
  onChange,
  LinkComponent = 'a',
}: Props) {
  const rootActive = !activeTag
  const rootStyle =
    'block w-full rounded-md px-2 py-2 text-left font-semibold transition-colors ' +
    (rootActive
      ? 'text-primary-500'
      : 'text-gray-700 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-400')
  const categoryStyle = (selected: boolean) =>
    'flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ' +
    (selected
      ? 'bg-blue-500/10 font-semibold text-primary-500'
      : 'text-gray-700 hover:bg-gray-200/50 hover:text-primary-500 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-primary-400')

  return (
    <aside
      aria-label="內容分類"
      className="hidden w-full rounded-xl border border-gray-200/70 bg-gray-100/60 p-4 md:block dark:border-gray-700/50 dark:bg-gray-800/70"
    >
      {onChange ? (
        <button
          type="button"
          className={rootStyle}
          aria-current={rootActive ? 'page' : undefined}
          onClick={() => onChange('')}
        >
          {rootLabel}
        </button>
      ) : rootActive ? (
        <span className={rootStyle} aria-current="page">
          {rootLabel}
        </span>
      ) : (
        <LinkComponent href={rootHref} className={rootStyle}>
          {rootLabel}
        </LinkComponent>
      )}
      <ul className="mt-2 space-y-1 border-t border-gray-200/70 pt-2 pl-3 dark:border-gray-700/60">
        {categories.map(({ id, label, count, href }) => {
          const selected = activeTag === id
          const content = (
            <>
              <span className="min-w-0 break-words">{label}</span>
              {count !== undefined && (
                <span className="shrink-0 text-xs tabular-nums opacity-60">{count}</span>
              )}
            </>
          )
          return (
            <li key={id}>
              {onChange ? (
                <button
                  type="button"
                  className={categoryStyle(selected)}
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onChange(id)}
                >
                  {content}
                </button>
              ) : selected ? (
                <span className={categoryStyle(true)} aria-current="page">
                  {content}
                </span>
              ) : (
                <LinkComponent href={href} className={categoryStyle(false)}>
                  {content}
                </LinkComponent>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
