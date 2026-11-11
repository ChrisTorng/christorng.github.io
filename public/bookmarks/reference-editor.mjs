// Shared by full and quick bookmark editors. No reference is created until Save.
export const referenceEditorMarkup =
 '<section class="reference-editor" aria-label="額外參考網址">'+
 '<div class="reference-header"><strong>額外參考網址（選填）</strong><button type="button" id="addReference">＋ 新增網址</button></div>'+
 '<label class="reference-hn-choice"><input id="editHnReference" type="checkbox">自動附上 Hacker News 留言</label>'+
 '<div id="editReferences" class="reference-rows"></div>'+
 '<p id="editReferenceStatus" class="reference-status" role="status" aria-live="polite"></p></section>';

export function createReferenceEditor(request,getSource) {
  const list=document.getElementById('editReferences');
  const checkbox=document.getElementById('editHnReference');
  const status=document.getElementById('editReferenceStatus');
  const pending=new Set();
  let generation=0;
  function notify(value,error=false){
    status.textContent=value;
    status.classList.toggle('error',error);
  }
  function addRow(ref={}) {
    const row=document.createElement('div');
    row.className='reference-row';
    row.dataset.kind=ref.kind==='hacker-news'?'hacker-news':'link';
    row.innerHTML='<input class="reference-url" type="url" placeholder="https://…" aria-label="參考網址">'+
      '<input class="reference-title" type="text" maxlength="500" placeholder="自動取得標題（可修改）" aria-label="參考標題">'+
      '<button type="button" class="reference-lookup" title="重新取得網頁標題">抓標題</button>'+
      '<button type="button" class="reference-remove" title="移除參考網址" aria-label="移除參考網址">×</button>';
    const urlField=row.querySelector('.reference-url');
    const titleField=row.querySelector('.reference-title');
    urlField.value=ref.url||'';
    titleField.value=ref.title||'';
    let changedTitle=false;
    titleField.addEventListener('input',()=>{changedTitle=true;});
    async function resolve() {
      const url=urlField.value.trim();
      if(!url)return;
      const version=generation;
      const btn=row.querySelector('.reference-lookup');
      btn.disabled=true;
      const task=request('/reference/lookup','POST',{type:'title',url});
      pending.add(task);
      try{
        const data=await task;
        if(version!==generation||!row.isConnected||urlField.value.trim()!==url)return;
        if(!changedTitle||!titleField.value.trim())titleField.value=data.reference.title;
        row.dataset.kind=data.reference.kind||'link';
        if(row.dataset.kind==='hacker-news')checkbox.checked=true;
        notify(data.found?'已取得參考網頁標題':'無法取得標題，可自行填寫或沿用網域名稱');
      }catch(error){if(version===generation)notify('讀取標題失敗：'+error.message,true);}
      finally{pending.delete(task);btn.disabled=false;}
    }
    urlField.addEventListener('change',resolve);
    row.querySelector('.reference-lookup').addEventListener('click',resolve);
    row.querySelector('.reference-remove').addEventListener('click',()=>{
      row.remove();
      if(row.dataset.kind==='hacker-news'&&!list.querySelector('[data-kind="hacker-news"]'))checkbox.checked=false;
    });
    list.append(row);
    return row;
  }
  function reset(references=[]) {
    generation++;
    list.replaceChildren();
    notify('');
    for(const ref of references||[])addRow(ref);
    checkbox.checked=Boolean((references||[]).some(ref=>ref.kind==='hacker-news'));
    checkbox.disabled=false;
  }
  checkbox.addEventListener('change',()=>{
    if(!checkbox.checked){
      list.querySelectorAll('[data-kind="hacker-news"]').forEach(row=>row.remove());
      notify('');
      return;
    }
    const {url,redirect_url}=getSource();
    if(!url.trim()){checkbox.checked=false;notify('請先填寫書籤原始網址',true);return;}
    checkbox.disabled=true;
    const version=generation;
    const task=request('/reference/lookup','POST',{type:'hn',url,redirect_url});
    pending.add(task);
    notify('正在搜尋相符的 Hacker News 留言串…');
    task.then(result=>{
      if(version!==generation)return;
      if(!result.found||!result.reference) {
        checkbox.checked=false;
        notify('找不到原文網址完全相符的 Hacker News 留言串，可手動加入網址');
        return;
      }
      list.querySelectorAll('[data-kind="hacker-news"]').forEach(row=>row.remove());
      addRow(result.reference);
      notify('已找到 Hacker News 留言串，儲存書籤後才會公開');
    }).catch(error=>{
      if(version===generation){checkbox.checked=false;notify('Hacker News 查詢失敗：'+error.message,true);}
    }).finally(()=>{pending.delete(task);if(version===generation)checkbox.disabled=false;});
  });
  document.getElementById('addReference').addEventListener('click',()=>addRow());
  return {
    reset,
    async collect() {
      await Promise.allSettled([...pending]);
      return [...list.querySelectorAll('.reference-row')].map(row=>({
        url:row.querySelector('.reference-url').value.trim(),
        title:row.querySelector('.reference-title').value.trim(),
        kind:row.dataset.kind
      })).filter(ref=>ref.url);
    }
  };
}
