import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { redirectOptions, findRedirectOption } from '../public/bookmarks/redirect-options.mjs'
import { sourceInfo, sourceBadge } from '../public/bookmarks/source-meta.mjs'

const choice = (url, id) => redirectOptions(url).find((x) => x.id === id)

test('Every HTTPS original page offers dynamic Wayback and Archive.today lookup', () => {
  const url = 'https://www.theverge.com/news/1027/discord#comments'
  assert.equal(choice(url, 'wayback').url, 'https://web.archive.org/https://www.theverge.com/news/1027/discord')
  assert.equal(choice(url, 'archive').url,
    'https://archive.is/submit/?url=' + encodeURIComponent('https://www.theverge.com/news/1027/discord'))
  assert.ok(!choice(url, 'archive').url.includes('/T0atg'))
  assert.equal(findRedirectOption(url, choice(url, 'wayback').url), 'wayback')
  assert.equal(findRedirectOption(url, choice(url, 'archive').url), 'archive')
})

test('X/Twitter has both known Nitter destinations, selected by target URL', () => {
  const url = 'https://x.com/cocktailpeanut/status/1860756706357022812'
  assert.equal(choice(url, 'nitter-a').url, 'https://nitter.tiekoetter.com/cocktailpeanut/status/1860756706357022812')
  assert.equal(choice(url, 'nitter-b').url, 'https://nitter.meowing.monster/cocktailpeanut/status/1860756706357022812')
  assert.equal(findRedirectOption(url, choice(url, 'nitter-b').url), 'nitter-b')
})

test('Reddit, GitHub and arXiv rules match the existing Tampermonkey transforms', () => {
  assert.equal(choice('https://old.reddit.com/r/linux/comments/1puojsr/?ref=123', 'reddit').url,
    'https://www.reddit.com/r/linux/comments/1puojsr/?ref=123')
  assert.equal(choice('https://github.com/ChrisTorng/TampermonkeyScripts?tab=readme-ov-file&foo=1', 'github').url,
    'https://github.com/ChrisTorng/TampermonkeyScripts?foo=1')
  assert.equal(choice('https://arxiv.org/pdf/2402.07939v1.pdf', 'arxiv').url,
    'https://arxiv.org/html/2402.07939v1')
})

test('Custom snapshot or blank override stays manual; invalid URLs have only manual option', () => {
  assert.equal(findRedirectOption('https://www.theverge.com/news/123', 'https://archive.is/T0atg'), 'manual')
  assert.equal(findRedirectOption('https://x.com/user/status/123', ''), 'manual')
  assert.deepEqual(redirectOptions('javascript:alert(1)').map(x => x.id), ['manual'])
  assert.deepEqual(redirectOptions('not a URL').map(x => x.id), ['manual'])
})

test('quick edit has full-viewport layout and accessible one-row radio controls', () => {
  const js = readFileSync(new URL('../public/bookmarks/admin-quick.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../public/bookmarks/admin-quick.css', import.meta.url), 'utf8')
  assert.match(js, /role="radiogroup"/)
  assert.match(js, /name="redirectMode"/)
  assert.match(js, /field\.readOnly=mode!=='manual'/)
  assert.match(js, /editHeading'\)\.focus\(\{preventScroll:true\}\)/)
  assert.match(js, /history\.pushState/)
  assert.match(css, /#editDialog\{[\s\S]*?width:100vw;[\s\S]*?height:100dvh;/)
  assert.match(css, /#editDialog #editFields\{[\s\S]*?overflow-y:auto;/)
  assert.match(css, /#editDialog #editSummaryGroup\{[\s\S]*?flex:1 0 200px/)
  assert.match(css, /#editDialog #redirectModes\{[\s\S]*?overflow-x:auto;/)
  assert.match(css, /#editDialog \.dialog-actions\{[\s\S]*?flex:none;/)
})

test('bookmark source label uses only hostname and first URL path segment', () => {
  const source = sourceInfo('https://example.com/first/second?private=secret#hash')
  assert.equal(source.label, 'example.com/first')
  assert.match(source.icon, /google\.com\/s2\/favicons/)
  assert.ok(!source.icon.includes('private'))
  assert.equal(sourceInfo('data:text/html,test'), null)
  assert.ok(!sourceBadge('https://example.com/first?x=<tag>').includes('<tag>'))
})

test('mobile review snaps cards without splitting the pending count from its first item', () => {
  const js = readFileSync(new URL('../public/bookmarks/admin-quick.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../public/bookmarks/admin-quick.css', import.meta.url), 'utf8')
  assert.match(css, /scroll-snap-type:y mandatory/)
  assert.match(css, /\.quick-item\.first-pending\{scroll-snap-align:none\}/)
  assert.match(css, /height:calc\(100svh - 58px\)/)
  assert.match(js, /categoryDialog'\\)\\.showModal\\(\\)/)
  assert.match(js, /categoryEnglish/)
  assert.match(js, /categoryChinese/)
  assert.match(js, /tagOrders/)
  assert.doesNotMatch(js, /data-add-category/)
})
