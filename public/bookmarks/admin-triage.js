import { renderMathTitle, renderAdminMarkdown } from '/shared/math-v1/admin-math.mjs';
const $=id=>document.getElementById(id);
const local=['localhost','127.0.0.1'].includes(location.hostname);
const tokenKey='blog-bookmarks-admin-token';
const metricLabels={learning:'學習方法',awareness:'資訊掌握',depth:'資訊深度',durability:'長期有效',novelty:'新知增量',fit:'適合度'};
const state={items:[],orderIds:[],show:20,busy:new Set(),scoring:false,stop:false,deferred:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(text='',error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
const headers=()=>{
 const token=local&&sessionStorage.getItem(tokenKey);
 return token?{Authorization:'Bearer '+token}:{};
};
async function api(path,method='GET',body){
 const response=await fetch('/bookmarks/api/admin'+path,{
  method,credentials:'same-origin',cache:'no-store',
  headers:{...headers(),...(body===undefined?{}:{'Content-Type':'application/json'})},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const value=await response.json().catch(()=>({error:'伺服器回應格式錯誤'}));
 if(!response.ok)throw Error(value.error||'HTTP '+response.status);
 return value;
}
function statusText(item){return item.deferred?'延後待決定':item.stage===1?'已讀待決定':'未讀待決定';}
function safeLink(url){
 try{
  const u=new URL(url);
  return ['https:','http:'].includes(u.protocol)?u.href:null;
 }catch{return null;}
}
function dimensionValue(item,key){
 const a=item.analysis||{};
 return Number(key==='score'?a.score:a.dimensions?.[key])||0;
}
function sortedItems(){
 const group=new Map(state.items.map(x=>[x.id,x]));
 return state.orderIds.map(id=>group.get(id)).filter(Boolean).filter(item=>{
  const filter=$('reason').value;
  return !filter||item.analysis?.flags?.includes(filter);
 });
}
function computeOrder(){
 const field=$('dimension').value;
 const direction=$('direction').value==='asc'?1:-1;
 state.orderIds=[...state.items].sort((a,b)=>{
  const missingA=a.analysis?.basis==='insufficient', missingB=b.analysis?.basis==='insufficient';
  if(missingA!==missingB)return missingA?1:-1;
  return (dimensionValue(a,field)-dimensionValue(b,field))*direction ||
   a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
 }).map(x=>x.id);
}
function refreshCount(){
 const total=state.items.length, scored=state.items.filter(x=>x.assessed).length;
 $('counts').textContent='待決定 '+total+' 筆 · AI 已評 '+scored+' 筆 · 待評 '+(total-scored)+' 筆';
 $('progressHelp').textContent=state.scoring
  ?'正在逐批評估；目前排序先固定，避免你閱讀時項目跳動。按「套用最新排序」可重新排列。'
  :'分數越低越可能不值得讀。規則初評僅供排序，AI 也只是依已取得的資料預測；不會自動淘汰。';
 $('evaluate').textContent=state.scoring?'暫停 AI 評分':(scored===total?'重新檢查評分':'開始 AI 評分');
}
function metricLine(label,value){
 return '<div class="triage-metric"><span>'+esc(label)+'</span><strong>'+value+'</strong>'+
  '<div class="triage-bar"><i style="width:'+(Number.isFinite(Number(value))?value:0)+'%"></i></div></div>';
}
function card(item){
 const a=item.analysis;
 const url=safeLink(item.redirect_url||item.url)||safeLink(item.url);
 const title=item.title_zh||item.title||item.title_original||'未命名';
 const summary=String(item.summary||'').trim();
 const score=dimensionValue(item,'score');
 const unavailable=a?.basis==='insufficient';
 const metrics=Object.entries(metricLabels).map(([name,label])=>metricLine(label,unavailable?'—':dimensionValue(item,name))).join('');
 const flags=(a?.flags||[]).map(x=>'<span>'+esc(x)+'</span>').join('');
 const words=[...summary].length;
 const full=a?.full_chars!=null
  ?'正文 '+Number(a.full_chars).toLocaleString('zh-TW')+' 字元 · 約 '+Math.max(1,Math.round(a.read_minutes*.8))+'–'+Math.max(1,Math.round(a.read_minutes*1.3))+' 分鐘'
  :'全文字數未知 · 尚未成功擷取';
 const basis=a?.basis==='insufficient'?'資料不足，請檢查原文':a?.basis==='fulltext'?'全文分析':'僅摘要'+(item.assessed?' AI 評估':'規則初評');
 const relative='摘要 '+words.toLocaleString('zh-TW')+' 字元 · '+basis;
 const id=esc(item.id);
 return '<article class="triage-card" data-id="'+id+'" data-busy="'+state.busy.has(item.id)+'">'+
  '<div class="triage-top"><div><div class="triage-title">'+(url?'<a href="'+esc(url)+'" rel="noopener noreferrer" target="_blank">'+renderMathTitle(title)+' ↗</a>':renderMathTitle(title))+'</div>'+
  (item.title_original&&item.title_original!==title?'<div class="triage-original">'+renderMathTitle(item.title_original)+'</div>':'')+
  '</div><div class="triage-score"><strong>'+(unavailable?'—':score)+'</strong><small>'+(unavailable?'待核對正文':'總分 / 100')+'</small></div></div>'+
  '<div class="triage-flags">'+flags+'</div>'+
  '<div class="triage-summary admin-math-body">'+renderAdminMarkdown(summary||'（摘要缺漏：請先修復或查看原文）')+'</div>'+
  '<div class="triage-reason">'+esc(a?.reason||'尚未分析')+'</div>'+
  '<div class="triage-metrics">'+metrics+'</div>'+
  '<div class="triage-meta"><span>'+esc(relative)+'</span><span>'+esc(full)+'</span>'+
  '<span>'+esc(statusText(item))+'</span>'+
  '<span>加入 '+new Date(item.created_at).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'})+'</span></div>'+
  '<div class="triage-actions">'+
  '<button class="discard" data-action="discard" type="button">不公開 · 下一筆</button>'+
  '<button class="publish" data-action="publish" type="button">公開</button>'+
  (url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">閱讀原文 ↗</a>':'')+
  '<a href="/bookmarks/admin/?edit='+encodeURIComponent(item.id)+'&q='+encodeURIComponent(title)+'">編輯／公開</a>'+
  '<button type="button" class="inspect" data-action="inspect">擷取全文重評</button>'+
  '<button type="button" data-action="paste">貼上全文</button>'+
  '</div><div class="triage-paste" data-paste-area hidden><textarea maxlength="150000" placeholder="貼入文章正文，不含導覽、留言、廣告。不會儲存原文，只用於本次評估。"></textarea>'+
  '<div><button type="button" data-action="submit-paste">依貼上的全文評估</button> <span class="hint">擷取受限或是互動頁時使用</span></div></div></article>';
}
function render(preserveScroll=true){
 const y=window.scrollY;
 const items=sortedItems();
 $('items').innerHTML=items.length?items.slice(0,state.show).map(card).join(''):
  '<p class="hint">目前沒有符合條件的待處理書籤。</p>';
 $('more').hidden=items.length<=state.show;
 refreshCount();
 if(preserveScroll)window.scrollTo({top:y,behavior:'instant'});
}
function applyAnalysis(rows){
 for(const x of rows||[]){
  const item=state.items.find(v=>v.id===x.id);
  if(item){item.analysis=x.analysis;item.assessed=true;}
 }
 render();
}
async function load(){
 if(state.scoring){state.stop=true;}
 $('reload').disabled=true;
 notice('正在取得所有尚未決策的書籤…');
 try{
  const results=await api('/triage?deferred='+(state.deferred?'1':'0'));
  state.items=results.items||[];
  state.show=20;
  computeOrder();
  render(false);
  notice('');
  if(state.items.some(x=>!x.assessed))void evaluate();
 }catch(e){notice('讀取失敗：'+e.message,true);}
 finally{$('reload').disabled=false;}
}
async function evaluate(){
 if(state.scoring){state.stop=true;notice('正在停止自動 AI 評分…');return;}
 state.scoring=true;state.stop=false;refreshCount();
 let failures=0;
 try{
  while(!state.stop){
   const missing=state.items.filter(x=>!x.assessed&&!state.busy.has(x.id)).slice(0,6);
   if(!missing.length)break;
   notice('正在評估：'+missing.map(x=>x.title_zh||x.title).join('、').slice(0,140));
   const result=await api('/triage/score','POST',{ids:missing.map(x=>x.id)});
   if(!Array.isArray(result.updated)||!result.updated.length){
    failures++;if(failures>=2)throw Error('連續未取得新的有效評分，請重新整理再試。');
    continue;
   }
   failures=0;
   applyAnalysis(result.updated);
  }
  if(!state.stop)notice('已完成本次可評估的書籤。需要重新依新分數排序時，按「套用最新排序」。');
  else notice('已暫停 AI 評分，結果已保留，可隨時繼續。');
 }catch(e){notice('AI 評估暫停：'+e.message+'。未完成項目仍可使用規則初評。',true);}
 finally{state.scoring=false;state.stop=false;refreshCount();}
}
async function discard(item){
 const previous=item.stage===1?(item.deferred?5:1):0;
 state.busy.add(item.id);render();
 try{
  const updated=await api('/'+item.id,'PATCH',{status:2});
  if(updated?.status!==2)throw Error('伺服器沒有確認不公開');
  state.items=state.items.filter(x=>x.id!==item.id);
  state.orderIds=state.orderIds.filter(id=>id!==item.id);
  render();
  notice('已設為不公開：'+(item.title_zh||item.title)+'。需要復原請按下方按鈕。');
  const action=document.createElement('button');
  action.type='button';action.textContent='復原這筆';
  action.style.marginLeft='10px';
  action.onclick=async()=>{
   action.disabled=true;
   try{
    await api('/'+item.id,'PATCH',{status:previous});
    state.items.push({...item,stage:previous===5?1:previous,deferred:previous===5?1:0});
    computeOrder();render();notice('已復原至待處理。');
   }catch(e){notice('復原失敗：'+e.message,true);action.disabled=false;}
  };
  $('notice').append(action);
 }catch(e){notice('未成功儲存「不公開」：'+e.message,true);}
 finally{state.busy.delete(item.id);render();}
}
async function publish(item){
 state.busy.add(item.id);
 render();
 notice('正在公開：'+(item.title_zh||item.title));
 try{
  const result=await api('/'+item.id,'PATCH',{status:3});
  if(![3,4].includes(result?.status))throw Error('後端未確認公開成功');
  state.items=state.items.filter(x=>x.id!==item.id);
  state.orderIds=state.orderIds.filter(id=>id!==item.id);
  render();
  notice((result.status===4?'已公開並推薦：':'已公開：')+(item.title_zh||item.title));
 }catch(error){
  notice('公開失敗，狀態沒有變更：'+error.message+'。若缺少分類或摘要，請使用「編輯」補齊。',true);
 }finally{
  state.busy.delete(item.id);
  render();
 }
}
async function inspect(item){
 state.busy.add(item.id);render();notice('正在從原始站點擷取正文：'+(item.title_zh||item.title));
 try{
  const res=await api('/triage/inspect','POST',{id:item.id});
  if(!res.available){notice('無法擷取全文：'+res.reason+'。可開原文複製後使用「貼上全文」。',true);return;}
  if(res.analysis)applyAnalysis([{id:item.id,analysis:res.analysis}]);
  notice('已擷取正文 '+res.chars.toLocaleString('zh-TW')+' 字元；'+
   (res.score_error?'AI 重評未完成：'+res.score_error:'已使用全文重新評分。'));
 }catch(e){notice('擷取或重評失敗：'+e.message,true);}
 finally{state.busy.delete(item.id);render();}
}
async function paste(item,cardNode){
 const area=cardNode?.querySelector('[data-paste-area]');
 if(!area)return;
 area.hidden=false;
 const textarea=area.querySelector('textarea');
 try{
  if(!textarea.value&&navigator.clipboard?.readText)textarea.value=await navigator.clipboard.readText();
 }catch{}
 textarea.focus();
 notice('已開啟正文貼入區。只有按「依貼上的全文評估」才會送出。');
}
async function submitPaste(item,cardNode){
 const textarea=cardNode?.querySelector('textarea');
 const content=textarea?.value.trim()||'';
 if(content.length<300){notice('需要至少 300 字元的正文，才能進行全文重評。',true);return;}
 state.busy.add(item.id);notice('正在依貼入的原文重新評分…');
 try{
  const result=await api('/triage/paste','POST',{id:item.id,content});
  if(result.analysis)applyAnalysis([{id:item.id,analysis:result.analysis}]);
  notice('全文重評已完成；原文內容未保存到書籤資料庫。');
 }catch(e){notice('全文重評失敗：'+e.message+'。貼入內容仍保留在目前頁面。',true);}
 finally{state.busy.delete(item.id);const current=state.items.find(x=>x.id===item.id);
  if(!current)return;const node=$('items').querySelector('[data-id="'+item.id+'"]');
  if(node){node.dataset.busy='false';}
 }
}
$('items').addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');
 if(!button)return;
 const node=button.closest('.triage-card');
 const item=state.items.find(x=>x.id===node?.dataset.id);
 if(!item||state.busy.has(item.id))return;
 if(button.dataset.action==='discard')void discard(item);
 if(button.dataset.action==='publish')void publish(item);
 if(button.dataset.action==='inspect')void inspect(item);
 if(button.dataset.action==='paste')void paste(item,node);
 if(button.dataset.action==='submit-paste')void submitPaste(item,node);
});
for(const id of ['dimension','direction']){
 $(id).addEventListener('change',()=>{computeOrder();state.show=20;render(false);});
}
$('reason').addEventListener('change',()=>{state.show=20;render(false);});
$('deferred').addEventListener('change',()=>{state.deferred=$('deferred').checked;void load();});
$('evaluate').addEventListener('click',()=>{void evaluate();});
$('resort').addEventListener('click',()=>{computeOrder();render();notice('已根據最新分數重新排序。');});
$('reload').addEventListener('click',()=>{void load();});
$('more').addEventListener('click',()=>{state.show+=20;render();});
void load();