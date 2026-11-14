import { redirectOptions, findRedirectOption } from './redirect-options.mjs';
import { sourceBadge } from './source-meta.mjs';
import {createReferenceEditor,referenceEditorMarkup} from './reference-editor.mjs';
const $ = id => document.getElementById(id);
const local = ['localhost','127.0.0.1'].includes(location.hostname);
const tokenKey = 'blog-bookmarks-admin-token';
const choices = [3,6,10];
const initialSize = Number(new URLSearchParams(location.search).get('size'));
const state = {
 size:choices.includes(initialSize)?initialSize:3,
 recent:[], pending:[], deferred:[], tags:[], remaining:0, deferredRemaining:0,
 expanded:new Set(),
 loading:false, inflight:0, generation:0, changeVersion:0,
 writes:new Map(), busy:new Set(), summaryActivity:new Map(), tagOrders:new Map(), refreshTagOrder:false,
 categoryTarget:null, categoryScrollY:0
};
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateText = value => value ? new Intl.DateTimeFormat('zh-TW',{
 timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',
 hour:'2-digit',minute:'2-digit',hourCycle:'h23'
}).format(new Date(value)) : '';
const levels = ['未讀','已讀','不公開','公開','推薦','稍後再決定'];
// Keep the stored default tag unchanged; display it as 未分類.
const tagLabel = (tag,fallback='') =>
 tag?.id==='default'||String(tag?.name||fallback).toLowerCase()==='default'
  ?'未分類':(tag?.name||fallback);
function message(text='',error=false){
 $('message').textContent=text;
 $('message').classList.toggle('error',error);
}
function headers(){
 const token=local&&sessionStorage.getItem(tokenKey);
 return token?{Authorization:'Bearer '+token}:{};
}
async function request(path,method='GET',body,signal){
 const response=await fetch('/bookmarks/api/admin'+path,{
  method,signal,credentials:'same-origin',cache:'no-store',
  headers:{...headers(),...(body===undefined?{}:{'Content-Type':'application/json'})},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const data=await response.json().catch(()=>({error:'伺服器回應格式錯誤'}));
 if(!response.ok)throw Error(data.error||'HTTP '+response.status);
 return data;
}
// Older Workers returned only the newest pending window. Until the updated Worker
// is deployed, use the existing paged admin API to obtain the oldest 20 items.
async function quickWindow(size){
 const data=await request('/quick?size='+size);
 if(data.pending_order==='oldest')return data;
 const oldest=await request('/?filter=pending&sort=old&page=1');
 return {...data,deferred:data.deferred||[],deferredRemaining:data.deferredRemaining||0,pending:oldest.items,remaining:oldest.total};
}
function queueWrite(id,action){
 const earlier=state.writes.get(id)||Promise.resolve();
 const task=earlier.catch(()=>{}).then(action);
 state.writes.set(id,task);
 task.then(()=>{if(state.writes.get(id)===task)state.writes.delete(id)},
   ()=>{if(state.writes.get(id)===task)state.writes.delete(id)});
 return task;
}
function orderedTags(b) {
 let order=state.tagOrders.get(b.id);
 if(!order){
  const selected=new Set((b.tags||[]).map(x=>x.toLowerCase()));
  order=[...state.tags].sort((a,z)=>{
   if((a.id==='default')!==(z.id==='default'))return a.id==='default'?1:-1;
   const as=selected.has(a.name.toLowerCase()),zs=selected.has(z.name.toLowerCase());
   if(as!==zs)return as?-1:1;
   return Number(z.count||0)-Number(a.count||0)||a.name.localeCompare(z.name);
  }).map(t=>t.id);
  state.tagOrders.set(b.id,order);
 }
 const byId=new Map(state.tags.map(t=>[t.id,t]));
 return [...order.map(id=>byId.get(id)).filter(Boolean),
  ...state.tags.filter(t=>!order.includes(t.id))];
}
function decisionDisabled(b,level){
 return state.busy.has(b.id) ||
  ([2,3,4].includes(level)&&!String(b.summary||'').trim()) ||
  ([3,4].includes(level)&&!b.tags.some(tag=>tag.toLowerCase()!=='default'));
}
function summaryMarkup(b){
 if(String(b.summary||'').trim())return '<p class="quick-summary">'+esc(b.summary)+'</p>';
 const activity=state.summaryActivity.get(b.id);
 return '<div class="quick-summary-repair">'+
  '<p class="quick-summary missing-summary'+(activity?.startsWith('摘要失敗')?' error':'')+'" role="status">'+esc(activity||'尚無摘要')+'</p>'+
  '<button type="button" data-summarize-clipboard'+(state.busy.has(b.id)?' disabled':'')+'>從剪貼簿產生摘要</button></div>';
}
function card(b,kind,first=false){
 const target=b.preferred_url||b.redirect_url||b.url;
 const expanded=state.expanded.has(b.id);
 if(kind==='deferred'&&!expanded) return '<article class="quick-item deferred collapsed" data-id="'+esc(b.id)+'" data-kind="deferred"><button type="button" class="quick-expand" data-toggle-deferred aria-expanded="false">▸ '+esc(b.title_zh||b.title)+'</button></article>';
 const original=b.title_original&&b.title_original!==(b.title_zh||b.title)
  ?'<div class="quick-original" lang="en">'+esc(b.title_original)+'</div>':'';
 const tags=new Set(b.tags.map(t=>t.toLowerCase()));
 const categoryButtons=orderedTags(b).map(t=>{
  const selected=tags.has(t.name.toLowerCase());
  return '<button type="button" class="category" data-tag-name="'+esc(t.name)+'" title="'+esc(tagLabel(t))+'" aria-pressed="'+selected+'">'+esc(tagLabel(t))+'</button>';
 }).join('');
 const actions=[3,4,2,5].map(level=>{
  const disabled=decisionDisabled(b,level);
  const selected=b.status===level;
  return '<button type="button" data-decision="'+level+'" aria-pressed="'+selected+'"'+(disabled?' disabled':'')+'>'+levels[level]+'</button>';
 }).join('');
 return '<article class="quick-item '+kind+(first?' first-pending':'')+(kind==='deferred'?' expanded':'')+'" data-id="'+esc(b.id)+'" data-kind="'+kind+'" tabindex="-1">'+
  (kind==='deferred'?'<button type="button" class="quick-collapse" data-toggle-deferred aria-expanded="true">▾ 收合</button>':'')+
  '<div class="quick-main"><div class="quick-content"><a class="quick-title" href="'+esc(target)+'" target="_blank" rel="noopener noreferrer" data-read>'+esc(b.title_zh||b.title)+' ↗</a>'+
  original+'<div class="quick-source">'+sourceBadge(b.url)+'</div><div class="quick-date"><a href="/bookmarks/view/?id='+encodeURIComponent(b.id)+'" target="_blank" rel="noopener noreferrer" title="預覽書籤單項頁">'+esc(dateText(b.created_at))+'</a></div>'+
  summaryMarkup(b)+
  '</div><div class="quick-actions">'+actions+
  '<button type="button" data-edit>編輯</button>'+
  '<button type="button" class="quick-delete" data-delete>刪除</button></div></div>'+
  '<aside class="quick-categories" aria-label="分類">'+categoryButtons+
  '<div class="quick-add-category"><button type="button" data-show-add-category>＋新增分類</button></div></aside></article>';
}

function findCard(id){
 return [...$('items').querySelectorAll('.quick-item')].find(x=>x.dataset.id===id);
}
function firstPending(){
 return $('items').querySelector('.quick-item[data-kind="pending"]');
}
function focusNext(){
 const next=firstPending();
 if(!next)return;
 next.focus({preventScroll:true});
 ($('items').querySelector('.pending-label')||next).scrollIntoView({block:'start',behavior:'instant'});
}
function render({focus=false,preserveId=null}={}){
 const anchor=preserveId?findCard(preserveId):null;
 const top=anchor?.getBoundingClientRect().top;
 const deferred=state.deferred.slice(0,state.size);
 const recent=state.recent.slice(-state.size);
 const pending=state.pending.slice(0,state.size);
 const last=state.recent.at(-1);
 const lastTags=last?.tags.map(name=>{
  const t=state.tags.find(t=>t.name.toLowerCase()===name.toLowerCase());
  return esc(tagLabel(t,name));
 }).join('、');
 const lastLabel=last?'<span class="quick-latest-group">'+
  '<button type="button" class="quick-latest" data-scroll-previous title="查看上一筆已處理書籤">'+
   esc(last.status===4?'已推薦':last.status===3?'已公開':'不公開')+
   (lastTags?' · '+lastTags:'')+'</button>'+
   (last.status===4&&!state.busy.has(last.id)
    ?'<a class="quick-write-note" href="/notes/editor/?bookmark='+encodeURIComponent(last.id)+
      '" target="_blank" rel="noopener noreferrer" title="另開隨筆編輯器並引用這筆推薦書籤">另開寫隨筆 ↗</a>':'')+
   '</span>':'';
 $('items').innerHTML=
  (deferred.length?'<div class="quick-section-label">稍後再決定 · '+state.deferredRemaining+' 筆（點標題展開）</div>':'')+
  deferred.map(b=>card(b,'deferred')).join('')+
  (recent.length?'<div class="quick-section-label">最近已處理 · '+recent.length+' 筆</div>':'')+
  recent.map(b=>card(b,'recent')).join('')+
  '<div class="quick-section-label pending-label"><span>待處理 '+state.remaining.toLocaleString('zh-TW')+' 筆</span>'+lastLabel+'</div>'+
  (pending.length?pending.map((b,i)=>card(b,'pending',i===0)).join(''):
   '<p class="empty">'+(state.remaining?'正在載入待處理書籤…':'目前已全部處理完成。')+'</p>');
 if(focus){focusNext();return;}
 if(top!==undefined){
  const next=findCard(preserveId);
  if(next)window.scrollBy({top:next.getBoundingClientRect().top-top,behavior:'instant'});
 }
}

function updateCard(b){
 const item=findCard(b.id);
 if(!item)return;
 const wasFocused=item===document.activeElement;
 const kind=item.dataset.kind;
 const contentScroll=item.querySelector('.quick-content')?.scrollTop||0;
 const categoryScroll=item.querySelector('.quick-categories')?.scrollTop||0;
 item.outerHTML=card(b,kind,item.classList.contains('first-pending'));
 const replacement=findCard(b.id);
 const content=replacement?.querySelector('.quick-content');
 if(content)content.scrollTop=contentScroll;
 const categories=replacement?.querySelector('.quick-categories');
 if(categories)categories.scrollTop=categoryScroll;
 if(wasFocused)replacement?.focus({preventScroll:true});
}
async function load(size=state.size,{focus=true}={}){
 const generation=++state.generation;
 state.loading=true;
 message('載入中…');
 try{
  const [data,tags]=await Promise.all([quickWindow(size),request('/tags')]);
  if(generation!==state.generation)return;
  state.size=size;
  state.recent=data.recent;
  state.deferred=data.deferred||[];
  state.deferredRemaining=data.deferredRemaining||0;
  state.pending=data.pending;
  state.remaining=data.remaining;
  state.tags=tags;
  state.tagOrders.clear();
  state.loading=false;
  $('size').value=String(size);
  render({focus});
  message('');
 }catch(error){
  if(generation===state.generation){state.loading=false;message(error.message,true);}
 }
}
// Reconcile only once all decisions have finished. Ignore responses overtaken by
// new user actions; this prevents a stale fetch from bringing back processed cards.
async function reconcile(){
 if(state.inflight||state.loading)return;
 const version=state.changeVersion;
 const generation=state.generation;
 const anchor=firstPending()?.dataset.id;
 try{
  const [data,tags]=await Promise.all([
   quickWindow(state.size),request('/tags')
  ]);
  if(generation!==state.generation||version!==state.changeVersion||state.inflight)return;
  state.recent=data.recent;
  state.deferred=data.deferred||[];
  state.deferredRemaining=data.deferredRemaining||0;
  state.pending=data.pending;
  state.remaining=data.remaining;
  state.tags=tags;
  if(state.refreshTagOrder){state.tagOrders.clear();state.refreshTagOrder=false;}
  render({preserveId:anchor});
 }catch(error){message('已儲存，但同步清單失敗：'+error.message,true);}
}
async function summarizeClipboard(b){
 const id=b.id;
 if(state.loading||state.busy.has(id)||String(b.summary||'').trim())return;
 state.busy.add(id);
 state.inflight++;
 state.changeVersion++;
 state.summaryActivity.set(id,'正在讀取剪貼簿…');
 updateCard(b);
 try{
  if(!navigator.clipboard?.readText)throw Error('瀏覽器無法讀取剪貼簿，可在編輯視窗貼上原文。');
  let content;
  try{
   content=(await navigator.clipboard.readText()).trim();
  }catch{
   throw Error('無法讀取剪貼簿，請允許存取後重試，或在編輯視窗貼上原文。');
  }
  if(!content)throw Error('剪貼簿沒有文字，請先複製文章。');
  if(content.length>150000)throw Error('剪貼簿文字超過 15 萬字元，請縮短後重試。');
  state.summaryActivity.set(id,'正在產生摘要…');
  updateCard(b);
  const result=await queueWrite(id,()=>request('/summary-repair','POST',{id,content},AbortSignal.timeout(35000)));
  b.summary=result.summary;
  state.summaryActivity.delete(id);
 }catch(error){
  const reason=error.name==='TimeoutError'?'等待摘要逾時，請重試。':error.message;
  state.summaryActivity.set(id,'摘要失敗：'+reason);
 }finally{
  state.busy.delete(id);
  state.inflight--;
  const current=[...state.recent,...state.deferred,...state.pending].find(item=>item.id===id);
  if(current){
   if(!state.summaryActivity.has(id))current.summary=b.summary;
   updateCard(current);
  }
  if(!state.inflight)void reconcile();
 }
}
function takeDecision(b,level){
 if(state.loading||decisionDisabled(b,level))return;
 const oldStatus=b.status;
 if(oldStatus===level)return;
 const previousRecent=[...state.recent];
 const wasPending=oldStatus<2;
 const wasDeferred=oldStatus===5;
 state.busy.add(b.id);
 state.inflight++;
 state.changeVersion++;
 const next={...b,status:level};
 state.pending=state.pending.filter(x=>x.id!==b.id);
 state.deferred=state.deferred.filter(x=>x.id!==b.id);
 state.recent=state.recent.filter(x=>x.id!==b.id);
 if(level===5){
  state.deferred=[...state.deferred,next]
   .sort((a,z)=>a.created_at.localeCompare(z.created_at)||a.id.localeCompare(z.id));
  state.expanded.delete(b.id);
  state.deferredRemaining++;
 }else{
  state.recent=[...state.recent,next].slice(-state.size);
 }
  state.tagOrders.clear();
  state.refreshTagOrder=true;
 if(wasPending)state.remaining--;
 if(wasDeferred)state.deferredRemaining--;
 render({focus:wasPending,preserveId:wasPending?null:b.id});
 message('已選擇「'+levels[level]+'」，正在儲存…');
 queueWrite(b.id,()=>request('/'+b.id,'PATCH',{status:level,tags:[...b.tags]}))
 .then(()=>message('已儲存：'+levels[level]),error=>{
  // Roll back only the failed record, preserving other concurrent decisions.
  state.pending=state.pending.filter(x=>x.id!==b.id);
  state.deferred=state.deferred.filter(x=>x.id!==b.id);
  state.recent=state.recent.filter(x=>x.id!==b.id);
  if(level===5)state.deferredRemaining--;
  if(wasPending){
   state.pending=[...state.pending,b]
    .sort((a,z)=>a.created_at.localeCompare(z.created_at)||a.id.localeCompare(z.id));
   state.remaining++;
  }else if(wasDeferred){
   state.deferred=[...state.deferred,b]
    .sort((a,z)=>a.created_at.localeCompare(z.created_at)||a.id.localeCompare(z.id));
   state.deferredRemaining++;
  }else{
   const original=previousRecent.find(x=>x.id===b.id)||b;
   const position=previousRecent.findIndex(x=>x.id===b.id);
   state.recent.splice(Math.min(Math.max(0,position),state.recent.length),0,original);
   state.recent=state.recent.slice(-state.size);
  }
  state.changeVersion++;
  render({focus:wasPending,preserveId:wasPending?null:b.id});
  message('儲存失敗：'+error.message,true);
 }).finally(()=>{
  state.busy.delete(b.id);
  state.inflight--;
  if(!state.inflight)void reconcile();
 });
}
function changeTag(b,name){
 if(state.busy.has(b.id)||state.loading)return;
 const old=[...b.tags];
 const selected=old.some(t=>t.toLowerCase()===name.toLowerCase());
 if(selected&&[3,4].includes(b.status)&&old.length===1){
  message('公開或推薦的書籤必須保留至少一個分類；可先改成不公開',true);
  return;
 }
 const next=selected?old.filter(t=>t.toLowerCase()!==name.toLowerCase()):[...old,name];
 b.tags=next;
 state.changeVersion++;
 updateCard(b);
 const version=state.changeVersion;
 queueWrite(b.id,()=>request('/'+b.id,'PATCH',{tags:next}))
 .then(()=>{
  if(version===state.changeVersion)message('分類已儲存');
 },error=>{
  if(b.tags===next || b.tags.join('\0')===next.join('\0')){
   b.tags=old;updateCard(b);
  }
  message('分類儲存失敗：'+error.message,true);
 });
}
async function addCategory(b,rawName,rawZh){
 if(state.busy.has(b.id)||state.loading)return false;
 const name=String(rawName||'').trim(),name_zh=String(rawZh||'').trim();
 if(!name||!name_zh||name.length>80||name_zh.length>80){
  $('categoryError').textContent='請輸入 1～80 字的英文與繁體中文分類名稱';
  return false;
 }
 if(state.tags.some(t=>t.name.toLowerCase()===name.toLowerCase())){
  $('categoryError').textContent='英文分類已存在，請直接選取現有分類';
  return false;
 }
 state.busy.add(b.id);state.inflight++;
 $('saveCategory').disabled=true;
 const previous=[...b.tags];
 try{
  const result=await queueWrite(b.id,()=>request('/tags','POST',{name,name_zh,bookmark_id:b.id}));
  Object.assign(b,result.item);
  state.tags=await request('/tags');
  state.changeVersion++;
  [...state.recent,...state.deferred,...state.pending].forEach(updateCard);
  message('已新增並選取分類：'+name);
  return true;
 }catch(error){
  b.tags=previous;
  $('categoryError').textContent='新增分類失敗：'+error.message;
  return false;
 }finally{
  state.busy.delete(b.id);state.inflight--;
  $('saveCategory').disabled=false;
  if(!state.inflight)void reconcile();
 }
}
function openCategoryDialog(b){
 state.categoryTarget=b.id;
 state.categoryScrollY=window.scrollY;
 $('categoryEnglish').value='';
 $('categoryChinese').value='';
 $('categoryError').textContent='';
 document.documentElement.style.scrollSnapType='none';
 $('categoryDialog').showModal();
 $('categoryHeading').focus({preventScroll:true});
}
let manualRedirectValue='';
function renderRedirectModes(mode='manual'){
 const options=redirectOptions($('editUrl').value);
 if(!options.some(x=>x.id===mode))mode='manual';
 const group=$('redirectModes');
 group.innerHTML=options.map(x=>
  '<label class="redirect-choice" title="'+esc(x.title)+'"><input type="radio" name="redirectMode" value="'+esc(x.id)+'"'+
  (mode===x.id?' checked':'')+'><span>'+esc(x.label)+'</span></label>'
 ).join('');
 const field=$('editRedirectUrl');
 field.readOnly=mode!=='manual';
 if(mode==='manual')field.value=manualRedirectValue;
 else field.value=options.find(x=>x.id===mode)?.url||'';
 field.title=field.readOnly?'依所選規則產生；切換至「手動」即可編輯':'可自行輸入完整網址，或留空';
}
function activeRedirectMode(){
 return $('redirectModes').querySelector('input[name="redirectMode"]:checked')?.value||'manual';
}

let summarizedArticleText='';
let editHistoryOpen=false;
let editClosing=false;
function closeEdit(){
 if($('editDialog').open)$('editDialog').close();
 if(editHistoryOpen&&!editClosing){
  editClosing=true;
  history.back();
 }
}
window.addEventListener('popstate',()=>{
 if(!editHistoryOpen)return;
 editHistoryOpen=false;
 editClosing=false;
 if($('editDialog').open)$('editDialog').close();
});
function edit(b){
 if(state.busy.has(b.id)||editClosing||$('editDialog').open)return;
 $('editId').value=b.id;
 $('editTitle').value=b.title_zh||b.title||'';
 $('editOriginalTitle').value=b.title_original||'';
 $('editUrl').value=b.url||'';
 const storedRedirect=b.redirect_url||'';
 const mode=findRedirectOption(b.url||'',storedRedirect);
 manualRedirectValue=mode==='manual'?storedRedirect:'';
 renderRedirectModes(mode);
 $('editSummary').value=b.summary||'';
 $('editArticleText').value='';
 $('editFullTextPanel').open=false;
 $('summaryProgress').textContent='';
 summarizedArticleText='';
 referenceEditor.reset(b.references||[]);
 $('editDialog').showModal();
 // A same-URL history entry makes the Android browser Back key close editing.
 // Keep focus on a non-input element so opening the dialog never raises the IME.
 history.pushState({...((history.state&&typeof history.state==='object')?history.state:{}),quickReviewEditing:true},'',location.href);
 editHistoryOpen=true;
 $('editHeading').focus({preventScroll:true});
}
function deleteBookmark(b){
 if(state.busy.has(b.id)||state.loading)return;
 if(!confirm('確定永久刪除這筆書籤？'))return;
 const wasPending=b.status<2,wasDeferred=b.status===5;
 state.busy.add(b.id);
 state.inflight++;
 state.changeVersion++;
 state.recent=state.recent.filter(item=>item.id!==b.id);
 state.deferred=state.deferred.filter(item=>item.id!==b.id);
 state.pending=state.pending.filter(item=>item.id!==b.id);
 if(wasPending)state.remaining--;
 if(wasDeferred)state.deferredRemaining--;
 render({focus:wasPending});
 message('正在刪除…');
 queueWrite(b.id,()=>request('/'+b.id,'DELETE')).then(result=>{
  if(!result.deleted)throw Error('找不到書籤');
  message('已刪除');
 },error=>{
  if(wasPending){
   state.pending.push(b);
   state.pending.sort((a,z)=>a.created_at.localeCompare(z.created_at)||a.id.localeCompare(z.id));
   state.remaining++;
  }else if(wasDeferred){
   state.deferred.push(b);
   state.deferred.sort((a,z)=>a.created_at.localeCompare(z.created_at)||a.id.localeCompare(z.id));
   state.deferredRemaining++;
  }else state.recent=[...state.recent,b].slice(-state.size);
  state.changeVersion++;
  render({focus:wasPending});
  message('刪除失敗：'+error.message,true);
 }).finally(()=>{
  state.busy.delete(b.id);
  state.inflight--;
  if(!state.inflight)void reconcile();
 });
}
$('app').innerHTML=
 '<header class="quick-header"><h1>書籤快速處理</h1><nav><a href="/bookmarks/admin/">完整管理</a> · <a href="/bookmarks/" target="_blank" rel="noopener">公開列表 ↗</a></nav></header>'+
 '<div class="quick-toolbar"><select id="size" aria-label="顯示數量">'+
 '<option value="3">3＋3＋3</option><option value="6">6＋6＋6</option>'+
 '<option value="10">10＋10＋10</option></select></div>'+
 '<div class="auth" id="auth"></div>'+
 '<div id="message" role="status" aria-live="polite"></div>'+
 '<main id="items" aria-label="快速處理清單"></main>'+
 '<dialog id="editDialog" aria-labelledby="editHeading"><form id="editForm">'+
 '<h2 id="editHeading" tabindex="-1" autofocus>編輯書籤</h2><input id="editId" type="hidden"><div id="editFields">'+
 '<label>繁體中文標題<input id="editTitle" required maxlength="500" autocomplete="off"></label>'+
 '<label>原文標題<input id="editOriginalTitle" maxlength="500" autocomplete="off"></label>'+
 '<label>原始網址<input id="editUrl" type="url" required></label>'+
 '<div class="redirect-group"><div class="redirect-header"><span>重導向網址</span><div id="redirectModes" role="radiogroup" aria-label="重導向方式"></div></div><input id="editRedirectUrl" type="url" aria-label="重導向網址" autocomplete="off"></div>'+
 '<label id="editSummaryGroup">摘要（Markdown）<textarea id="editSummary" maxlength="5000" placeholder="支援 Markdown；儲存後點日期預覽"></textarea></label>'+
 '<details id="editFullTextPanel"><summary>貼文章全文，重新產生摘要</summary>'+
 '<label>文章全文（僅用於此次 AI 處理，不儲存於資料庫）<textarea id="editArticleText" placeholder="貼入文章全文，最多 15 萬字元" spellcheck="false"></textarea></label>'+
 '<button type="button" id="regenerateSummary">重新摘要並填入上方欄位</button><span id="summaryProgress" role="status"></span></details>'+
 referenceEditorMarkup+'</div>'+
 '<div class="dialog-actions"><button id="saveEdit" type="submit">儲存</button><button id="cancelEdit" type="button">取消</button></div>'+
 '</form></dialog>'+
 '<dialog id="categoryDialog" aria-labelledby="categoryHeading"><form id="categoryForm">'+
 '<h2 id="categoryHeading" tabindex="-1">新增分類</h2>'+
 '<label>英文名稱<input id="categoryEnglish" maxlength="80" required autocomplete="off"></label>'+
 '<label>繁體中文名稱<input id="categoryChinese" maxlength="80" required autocomplete="off"></label>'+
 '<p id="categoryError" role="alert"></p>'+
 '<div class="dialog-actions"><button id="saveCategory" type="submit">儲存並選取</button><button id="cancelCategory" type="button">取消</button></div>'+
 '</form></dialog>';
const referenceEditor=createReferenceEditor(request,()=>({url:$('editUrl').value.trim(),redirect_url:$('editRedirectUrl').value.trim()}));
$('size').value=String(state.size);
$('redirectModes').addEventListener('change',event=>{
 if(!event.target.matches('input[name="redirectMode"]'))return;
 if(activeRedirectMode()==='manual')renderRedirectModes('manual');
 else renderRedirectModes(activeRedirectMode());
});
$('editRedirectUrl').addEventListener('input',()=>{
 if(activeRedirectMode()==='manual')manualRedirectValue=$('editRedirectUrl').value;
});
$('editUrl').addEventListener('input',()=>{
 renderRedirectModes(activeRedirectMode());
});

$('cancelCategory').onclick=()=>$('categoryDialog').close();
$('categoryDialog').addEventListener('cancel',event=>{event.preventDefault();$('categoryDialog').close();});
$('categoryDialog').addEventListener('close',()=>{
 const y=state.categoryScrollY;
 document.documentElement.style.scrollSnapType='';
 requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}));
});
$('categoryForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const b=[...state.recent,...state.deferred,...state.pending].find(x=>x.id===state.categoryTarget);
 if(b&&await addCategory(b,$('categoryEnglish').value,$('categoryChinese').value))$('categoryDialog').close();
});
async function regenerateSummary(id){
 const content=$('editArticleText').value.trim();
 if(content.length<60||content.length>150000)throw Error('請貼入 60～150000 字元的原文');
 $('regenerateSummary').disabled=true;
 $('summaryProgress').textContent='正在根據原文重新摘要…';
 try{
  const result=await request('/summary-repair/preview','POST',{id,content});
  $('editSummary').value=result.summary;
  summarizedArticleText=content;
  $('summaryProgress').textContent='已重新摘要；請檢查上方欄位，再按儲存';
  return result.summary;
 }finally{$('regenerateSummary').disabled=false;}
}
$('regenerateSummary').onclick=async()=>{
 try{await regenerateSummary($('editId').value);}
 catch(error){$('summaryProgress').textContent='摘要失敗：'+error.message;}
};
$('cancelEdit').onclick=closeEdit;
$('editDialog').addEventListener('cancel',event=>{
 event.preventDefault();
 closeEdit();
});
$('editForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const id=$('editId').value;
 const b=[...state.recent,...state.deferred,...state.pending].find(x=>x.id===id);
 if(!b||state.busy.has(id))return;
 let generatedSummary;
 try{
  if($('editArticleText').value.trim()&&$('editArticleText').value.trim()!==summarizedArticleText)
   generatedSummary=await regenerateSummary(id);
 }catch(error){$('summaryProgress').textContent='摘要失敗：'+error.message;return;}
 const raw={
  title_zh:$('editTitle').value.trim(),
  title_original:$('editOriginalTitle').value.trim(),
  url:$('editUrl').value.trim(),
  redirect_url:$('editRedirectUrl').value.trim(),
  summary:generatedSummary||$('editSummary').value.trim(),
  references:await referenceEditor.collect()
 };
 if(!raw.title_zh||!raw.url)return;
 state.busy.add(id);
 state.inflight++;
 state.changeVersion++;
 $('saveEdit').disabled=true;
 $('cancelEdit').disabled=true;
 try{
  const updated=await queueWrite(id,()=>request('/'+id,'PATCH',raw));
  Object.assign(b,updated);
  state.summaryActivity.delete(id);
  updateCard(b);
  closeEdit();
  message('已儲存');
 }catch(error){message('編輯失敗：'+error.message,true);}
 finally{
  state.busy.delete(id);
  state.inflight--;
  $('saveEdit').disabled=false;
  $('cancelEdit').disabled=false;
  if(!state.inflight)void reconcile();
 }
});
$('size').addEventListener('change',()=>{
 const size=Number($('size').value);
 if(!choices.includes(size))return;
 const url=new URL(location.href);
 if(size===3)url.searchParams.delete('size');else url.searchParams.set('size',String(size));
 history.replaceState(history.state,'',url.href);
 void load(size);
});
if(local){
 $('auth').innerHTML='<input id="token" type="password" autocomplete="off" placeholder="本機管理 Token"><button type="button" id="login">登入</button>';
 $('token').value=sessionStorage.getItem(tokenKey)||'';
 $('login').addEventListener('click',()=>{
  sessionStorage.setItem(tokenKey,$('token').value);
  void load();
 });
}
$('items').addEventListener('click',event=>{
 if(event.target.closest('[data-scroll-previous]')){
  const previous=[...$('items').querySelectorAll('.quick-item.recent')].at(-1);
  previous?.scrollIntoView({block:'start',behavior:'smooth'});
  return;
 }
 const element=event.target.closest('.quick-item');
 if(!element)return;
 const b=[...state.recent,...state.deferred,...state.pending].find(x=>x.id===element.dataset.id);
 if(!b)return;
 if(event.target.closest('[data-toggle-deferred]')){
  if(state.expanded.has(b.id))state.expanded.delete(b.id);
  else state.expanded.add(b.id);
  updateCard(b);
  return;
 }
 if(event.target.closest('[data-summarize-clipboard]')){void summarizeClipboard(b);return;}
 if(event.target.closest('[data-show-add-category]')){openCategoryDialog(b);return;}
 if(event.target.closest('[data-edit]')){edit(b);return;}
 if(event.target.closest('[data-delete]')){deleteBookmark(b);return;}
 const tag=event.target.closest('[data-tag-name]');
 if(tag){changeTag(b,tag.dataset.tagName);return;}
 const decision=event.target.closest('[data-decision]');
 if(decision){takeDecision(b,Number(decision.dataset.decision));return;}
 if(event.target.closest('[data-read]')&&b.status===0){
  // Opening the source does not advance the queue; it only marks it read.
  b.status=1;
  queueWrite(b.id,()=>request('/'+b.id,'PATCH',{status:1}))
   .catch(error=>message('已開啟原文，但標記已讀失敗：'+error.message,true));
 }
});
void load();
