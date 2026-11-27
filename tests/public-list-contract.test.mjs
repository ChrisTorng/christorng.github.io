import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('mixed timeline links its note title and uses the canonical short bookmark embed', () => {
  const timeline = read('components/notes/PublicTimeline.tsx')
  const embed = read('components/notes/BookmarkInline.tsx')
  assert.match(timeline, /<Link href=\{url\} className="title-link">/)
  assert.match(timeline, /entry\.html !== undefined/)
  assert.match(timeline, /<BookmarkInline id=\{entry.bookmark_id\} \/>/)
  assert.match(embed, /showReading = false/)
  assert.match(embed, /\/bookmarks\/api\/embed\//)
  assert.match(embed, /\?reading=0/)
  assert.doesNotMatch(embed, /BookmarkPublicItem|永久連結/)
  assert.match(read('components/notes/NotePublicItem.tsx'), /showReading=\{detail\}/)
})

test('article tag renderer and RSS display a hashtag without changing category IDs', () => {
  assert.match(read('components/Tag.tsx'), /#\{tag.displayName\}/)
  const rss = read('utils/rss.mjs')
  assert.match(rss, /#\$\{escapeXml\(tag\)\}/)
  assert.match(rss, /<category>\$\{escapeXml\(tagId\)\}<\/category>/)
})
