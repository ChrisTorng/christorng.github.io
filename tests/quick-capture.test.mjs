import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(new URL('../public/bookmarks/admin-quick.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/bookmarks/admin-quick.css',import.meta.url),'utf8');

test('only opening an article with a missing summary registers a capture',()=>{
 assert.match(js,/if\(!String\(b\.summary\|\|''\)\.trim\(\)\)/);
 assert.match(js,/event\.target\.closest\('a\[data-read\]'\)/);
 assert.match(js,/blog-bookmarks:capture-request/);
 assert.match(js,/detail:\{id:b\.id,url:link\.href\}/);
});
test('captured text passes through existing authenticated summary repair endpoint',()=>{
 assert.match(js,/blog-bookmarks:capture-result/);
 assert.match(js,/request\('\/summary-repair','POST',\{id,content\}/);
 assert.match(js,/capturedAck\(id,nonce\)/);
 assert.match(js,/blog-bookmarks:capture-deliver/);
});
test('fresh AI result is clearly labeled and does not auto-publish',()=>{
 assert.match(js,/剛從原文自動產生的摘要/);
 assert.match(js,/剛從剪貼簿產生的摘要/);
 assert.match(js,/noteSummaryOrigin\(id,'article'\)/);
 assert.match(js,/quick-review-recent-summaries:v1/);
 assert.match(css,/\.quick-summary-generated\{/);
 assert.match(css,/border:2px solid var\(--accent\)/);
 assert.match(js,/\(\[2,3,4\]\.includes\(level\)&&!String\(b\.summary\|\|''\)\.trim\(\)\)/);
});
