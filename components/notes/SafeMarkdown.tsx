'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

type MdNode = {
  type: string
  value?: string
  alt?: string
  checked?: boolean | null
  url?: string
  title?: string
  depth?: number
  ordered?: boolean
  start?: number | null
  children?: MdNode[]
}

function safeUrl(value?: string, baseUrl = 'https://christorng.idv.tw') {
  if (!value) return ''
  try {
    const url = new URL(value, baseUrl)
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return ''
    return url.href
  } catch {
    return ''
  }
}
function render(node: MdNode, key: number, baseUrl: string): ReactNode {
  const children = node.children?.map((child, index) => render(child, index, baseUrl))
  switch (node.type) {
    case 'root':
      return <Fragment key={key}>{children}</Fragment>
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'text':
      return node.value || ''
    case 'html':
      return node.value || ''
    case 'strong':
      return <strong key={key}>{children}</strong>
    case 'emphasis':
      return <em key={key}>{children}</em>
    case 'delete':
      return <del key={key}>{children}</del>
    case 'inlineCode':
      return <code key={key}>{node.value}</code>
    case 'code':
      return (
        <pre key={key}>
          <code>{node.value}</code>
        </pre>
      )
    case 'break':
      return <br key={key} />
    case 'thematicBreak':
      return <hr key={key} />
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>
    case 'heading': {
      const level = Math.min(6, Math.max(2, node.depth || 3))
      return (
        <p key={key} className={'font-bold ' + (level === 2 ? 'text-lg' : '')}>
          {children}
        </p>
      )
    }
    case 'list':
      return node.ordered ? (
        <ol key={key} start={node.start || 1}>
          {children}
        </ol>
      ) : (
        <ul key={key}>{children}</ul>
      )
    case 'listItem':
      return (
        <li key={key}>
          {typeof node.checked === 'boolean' && (
            <input type="checkbox" checked={node.checked} disabled aria-label="清單勾選狀態" />
          )}
          {children}
        </li>
      )
    case 'link': {
      const target = safeUrl(node.url, baseUrl)
      return target ? (
        <a key={key} href={target} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <span key={key}>{children}</span>
      )
    }
    case 'image': {
      const target = safeUrl(node.url)
      const label = node.alt || node.title || node.value || '圖片'
      return target && /^https?:\/\//.test(target) ? (
        // Dynamic Markdown images have no known dimensions; retain their intrinsic aspect ratio.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={target}
          alt={label}
          loading="lazy"
          decoding="async"
          className="my-2 h-auto max-w-full rounded"
        />
      ) : (
        <span key={key}>{label}</span>
      )
    }
    case 'table':
      return (
        <div key={key} className="overflow-x-auto">
          <table>{children}</table>
        </div>
      )
    case 'tableRow':
      return <tr key={key}>{children}</tr>
    case 'tableCell':
      return <td key={key}>{children}</td>
    default:
      return <Fragment key={key}>{children}</Fragment>
  }
}
export default function SafeMarkdown({
  text,
  baseUrl = 'https://christorng.idv.tw',
}: {
  text: string
  baseUrl?: string
}) {
  const tree = useMemo(
    () =>
      remark()
        .use(remarkGfm)
        .parse(text || '') as MdNode,
    [text]
  )
  return (
    <div className="prose dark:prose-invert max-w-none text-sm">{render(tree, 0, baseUrl)}</div>
  )
}
