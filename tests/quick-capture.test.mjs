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

});

test('private and deferred decisions do not require a summary or category',()=>{
 const source=js.match(/function decisionDisabled\(b,level\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(source);
 const state={busy:new Set(),summaryActivity:new Map()};
 const decisionDisabled=new Function('state',source+';return decisionDisabled;')(state);
 const b={id:'bookmark',summary:'',tags:[]};
 for(const summary of ['',null,'   ','A summary']){
  b.summary=summary;
  for(const tags of [[],['default'],['AI']]){
   b.tags=tags;
   state.summaryActivity.set(b.id,'Waiting for article verification');
   assert.equal(decisionDisabled(b,2),false);
   assert.equal(decisionDisabled(b,5),false);
   for(const level of [3,4]){
    assert.equal(decisionDisabled(b,level),!String(summary||'').trim()||!tags.includes('AI'));
   }
  }
 }
 state.busy.add(b.id);
 assert.equal(decisionDisabled(b,2),true);
});
