import katex from 'katex'

export function MathFormula({ tex, display = false }: { tex: string; display?: boolean }) {
  try {
    const html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
      trust: false,
      maxExpand: 1000,
      maxSize: 20,
    })
    return (
      <span
        className={
          display ? 'not-prose notranslate block max-w-full overflow-x-auto' : 'notranslate'
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch {
    return <span className="break-all">{tex}</span>
  }
}

// A title is plain text apart from complete math spans, not arbitrary HTML or Markdown links.
export function titleParts(text: string) {
  const parts: { value: string; math: boolean }[] = []
  const pattern =
    /(?<!\\)\\\((.+?)\\\)|(?<!\\)\\\[(.+?)\\\]|(?<![\\$])\$\$([^$\r\n]+?)\$\$|(?<![\\$])\$(?![\s$])([^$\r\n]+?)(?<![\s\\])\$(?![\d$])/g
  let start = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index!
    if (index > start) parts.push({ value: text.slice(start, index), math: false })
    parts.push({ value: match[0], math: true })
    start = index + match[0].length
  }
  if (start < text.length) parts.push({ value: text.slice(start), math: false })
  return parts
}

export function truncateMathTitle(text: string, limit: number) {
  const parts = titleParts(text)
  let result = ''
  let remaining = limit
  for (const part of parts) {
    const chars = Array.from(part.value)
    if (part.math) {
      if (chars.length > remaining && result) return result.trimEnd() + '…'
      if (chars.length > remaining) return part.value + (parts.length > 1 ? '…' : '')
      result += part.value
      remaining -= chars.length
    } else {
      if (chars.length > remaining)
        return (result + chars.slice(0, remaining).join('')).trimEnd() + '…'
      result += part.value
      remaining -= chars.length
    }
  }
  return result
}

export function MathTitle({ text }: { text: string }) {
  return (
    <>
      {titleParts(text).map((part, index) =>
        part.math ? (
          <MathFormula
            key={index}
            tex={part.value.slice(
              part.value.startsWith('$$') || part.value.startsWith('\\') ? 2 : 1,
              part.value.startsWith('$$') || part.value.startsWith('\\') ? -2 : -1
            )}
          />
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </>
  )
}
