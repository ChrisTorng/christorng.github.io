import test from 'node:test'
import assert from 'node:assert/strict'
import { generateRssItem, renderPostContent } from '../utils/rss.mjs'
import { rssMathImage } from '../utils/rss-math.mjs'

const config={siteUrl:'https://christorng.idv.tw'}
const post={title:'公式 $x^2$',summary:'摘要 $x^2$',date:'2026-11-28',slug:'math-test',tags:[],body:{raw:'行內 $x^2$。\n\n$$\n\\frac{a}{b}\n$$\n\n`$x^2$`\n'}}

test('article RSS contains absolute PNG references, escaped alt, and literal code',async()=>{
 const html=await renderPostContent(config,post)
 assert.match(html,/https:\/\/christorng\.idv\.tw\/bookmarks\/math\/v1\/i\/eF4y\.png/)
 assert.match(html,/https:\/\/christorng\.idv\.tw\/bookmarks\/math\/v1\/d\/XGZyYWN7YX17Yn0\.png/)
 assert.match(html,/<code>\$x\^2\$<\/code>/)
 assert.equal((html.match(/\.png"/g)||[]).length,2)
 const xml=await generateRssItem(config,post)
 assert.match(xml,/<title>公式 x\^2<\/title>/)
 assert.match(xml,/<content:encoded><!\[CDATA\[/)
})
test('untrusted or unsupported formulas remain escaped text',()=>{
 assert.doesNotMatch(rssMathImage('\\includegraphics{https://example.org/x}'),/<img/)
 assert.doesNotMatch(rssMathImage('\\unknownCommand'),/<img/)
 assert.match(rssMathImage('x<y'),/alt="x&lt;y"/)
})
