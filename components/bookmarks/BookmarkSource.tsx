type Source = { label: string; icon: string }

function sourceInfo(value: string): Source | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const first = url.pathname.split('/').filter(Boolean)[0] || ''
    let segment = first
    try {
      segment = decodeURIComponent(first)
    } catch {
      // Keep the encoded path if it contains invalid percent sequences.
    }
    return {
      label: url.hostname + (segment ? '/' + segment : ''),
      icon:
        'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(url.hostname) + '&sz=32',
    }
  } catch {
    return null
  }
}

export default function BookmarkSource({ url }: { url: string }) {
  const source = sourceInfo(url)
  if (!source) return null
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1.5" title={source.label}>
      {/* The cached service discovers a site's declared favicon; load only once visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source.icon}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-4 w-4 shrink-0 rounded-sm"
      />
      <span className="min-w-0 truncate">{source.label}</span>
    </span>
  )
}
