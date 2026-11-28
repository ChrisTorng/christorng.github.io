import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderAdminMarkdown, renderMathTitle, truncateMathTitle, refreshBookmarkMathPreview } from '../utils/admin-math.mjs'

test('reported bookmark summary renders all three formulas without rewriting its source', () => {
  const source = '矩陣乘法指數 $\\omega$ 的上下界皆為 $9/4$，以及證明了 $VP \\neq VNP$。'
  const html = renderAdminMarkdown(source)
  assert.equal((html.match(/class="katex"/g) || []).length, 3)
  assert.match(html, /<math/)
  assert.equal(source, '矩陣乘法指數 $\\omega$ 的上下界皆為 $9/4$，以及證明了 $VP \\neq VNP$。')
})
test('title math is atomic; code, money, and hostile raw HTML remain safe', () => {
  assert.match(renderMathTitle('矩陣 $\\omega$'), /class="katex"/)
  assert.equal(truncateMathTitle('標題 $\\frac{a}{b}$ 結尾', 6), '標題…')
  assert.doesNotMatch(renderAdminMarkdown('USD $20 and $30'), /class="katex"/)
  assert.doesNotMatch(renderAdminMarkdown('\x60$x^2$\x60'), /class="katex"/)
  assert.doesNotMatch(renderAdminMarkdown('<img src=x onerror=alert(1)>'), /<img/)
  assert.doesNotMatch(renderAdminMarkdown('[bad](javascript:alert(1))'), /href="javascript:/)
  assert.match(renderAdminMarkdown('$$\n\\frac{a}{b}\n$$'), /katex-display/)
})
test('editor preview never mutates raw source fields', () => {
  const fields = {
    editMathPreview:{}, editMathTitle:{}, editMathOriginal:{}, editMathSummary:{},
    editTitle:{value:'$x$'}, editOriginalTitle:{value:'$y$'}, editSummary:{value:'$\\omega$'}
  }
  refreshBookmarkMathPreview({getElementById:id=>fields[id]})
  assert.match(fields.editMathSummary.innerHTML,/class="katex"/)
  assert.equal(fields.editSummary.value,'$\\omega$')
})
test('all administrative routes load local KaTeX styles and use safe renderers', () => {
  for (const p of ['bookmarks/admin/index.html','bookmarks/admin/quick/index.html','bookmarks/admin/triage/index.html','bookmarks/admin/repair/index.html','notes/editor/index.html']) {
    const source = readFileSync(new URL('../public/'+p,import.meta.url),'utf8')
    assert.match(source,/\/shared\/math-v1\/katex\.min\.css/)
  }
  for (const p of ['admin.js','admin-quick.js','admin-triage.js']) {
    const source=readFileSync(new URL('../public/bookmarks/'+p,import.meta.url),'utf8')
    assert.match(source,/renderAdminMarkdown\(/)
    assert.match(source,/renderMathTitle\(/)
  }
})
