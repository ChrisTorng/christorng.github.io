'use client'

type CategoryOption = {
  value: string
  label: string
  href?: string
}

type Props = {
  value: string
  options: CategoryOption[]
  onChange?: (value: string) => void
}

/** Mobile counterpart of the desktop category sidebar. */
export default function MobileCategorySelect({ value, options, onChange }: Props) {
  return (
    <div className="mb-4 md:hidden">
      <label className="flex w-full items-center gap-3 rounded-lg border border-gray-200/70 bg-gray-100/60 px-3 py-2 dark:border-gray-700/50 dark:bg-gray-800/70">
        <span className="shrink-0 text-sm font-semibold text-gray-600 dark:text-gray-300">
          分類
        </span>
        <select
          aria-label="選擇分類"
          className="w-full min-w-0 cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-2 text-base font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          value={value}
          onChange={(event) => {
            const selected = event.target.value
            if (onChange) {
              onChange(selected)
              return
            }
            const href = options.find((option) => option.value === selected)?.href
            if (href) window.location.assign(href)
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
