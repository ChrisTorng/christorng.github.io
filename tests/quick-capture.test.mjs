import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const js=readFileSync(new URL('../public/bookmarks/admin-quick.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/bookmarks/admin-quick.css',import.meta.url),'utf8');

test('only opening an article with a missing summary registers a capture',()=>{
 assert.match(js,/if\(!String\(b\.summary\|\|''\)\.trim\(\)\)/);
 assert.match(js,/event\.target\.closest\('a\[data-read\]'\)/);
 assert.match(js,/blog-bookmarks:capture-request/);
 assert.match(js,/detail:\{id:b\.id,url:link\.href,source:b\.url\}/);
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

test('quick-review entry point invalidates cached JavaScript when its contents change',()=>{
 const html=readFileSync(new URL('../public/bookmarks/admin/quick/index.html',import.meta.url),'utf8');
 const bytes=Buffer.from(js,'utf8');
 const version=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex').slice(0,12);
 assert.ok(html.includes('/bookmarks/admin-quick.js?v='+version),
  'Update the script version to the first 12 characters of git hash-object public/bookmarks/admin-quick.js');
});

test('missing summaries offer direct capture without clipboard or reopening the article',()=>{
 assert.match(js,/data-capture-now/);
 assert.match(js,/立即擷取已開啟原文/);
 assert.match(js,/manual:true/);
 assert.match(js,/captureAttempts\.delete\(id\)/);
 assert.doesNotMatch(js,/驗證完成後將自動擷取全文/);
});


test('manual clear persists before requesting capture and leaves public summaries intact',()=>{
 const body=js.match(/async function clearSummary\(b\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(body);
 assert.match(body,/\[3,4\]\.includes\(b\.status\)/);
 assert.match(body,/request\('\/summary-repair\/clear','POST',\{id,summary:b\.summary\}\)/);
 assert.ok(body.indexOf('b.summary=result.summary')<body.indexOf('captureNow(b)'));
 assert.match(js,/data-clear-summary/);
});

test('short summary uses existing browser body before reopening the article',()=>{
 assert.match(js,/summary-repair\/from-reading/);
 assert.match(js,/await repairFromReading\(b,true\)/);
 assert.match(js,/void repairVisibleReading\(\)/);
});
