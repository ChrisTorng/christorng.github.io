// Client-side redirect presets. Keep in sync with
// ChrisTorng/TampermonkeyScripts/src/{RedirectUrls,InternetArchive,ArchiveToday}.user.js.
// The destination is always derived from the ORIGINAL URL, never from a previous snapshot.
export function redirectOptions(input) {
  const options = [{id:'manual',label:'手動',title:'自行輸入或留空，不套用重導向',url:null}];
  let u;
  try {
    u=new URL(input);
    if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return options;
  }catch{return options;}
  u.hash='';
  const original=u.href;
  options.push(
    {id:'wayback',label:'Wayback',title:'Internet Archive：未指定固定快照',url:'https://web.archive.org/'+original},
    {id:'archive',label:'Archive.today',title:'Archive.today：依原網址查詢或建立快照，不綁定快照 ID',url:'https://archive.is/submit/?url='+encodeURIComponent(original)}
  );
  if(u.protocol!=='https:')return options;
  const host=u.hostname.toLowerCase();
  const xPost=/^\/([^/]+)\/status\/(\d+)(?:\/|$)/.exec(u.pathname);
  if((host==='x.com'||host==='twitter.com')&&xPost){
    for(const [id,label,mirror] of [
      ['nitter-a','Nitter A','nitter.tiekoetter.com'],
      ['nitter-b','Nitter B','nitter.meowing.monster']
    ])options.push({id,label,title:mirror,url:'https://'+mirror+'/'+xPost[1]+'/status/'+xPost[2]});
  }
  if(host==='old.reddit.com'){
    const dest=new URL(original);dest.hostname='www.reddit.com';
    options.push({id:'reddit',label:'Reddit',title:'切換到 www.reddit.com',url:dest.href});
  }else if(host==='www.reddit.com'&&/^\/login\/?$/.test(u.pathname)&&u.searchParams.get('reason')==='lor2'){
    try{
      const dest=new URL(u.searchParams.get('dest'));
      if(dest.protocol==='https:'&&dest.hostname==='old.reddit.com'&&!dest.username&&!dest.password&&!dest.port){
        dest.hostname='www.reddit.com';
        options.push({id:'reddit',label:'Reddit',title:'跳過 old.reddit.com 登入恢復網址',url:dest.href});
      }
    }catch{}
  }
  if(host==='github.com'&&u.searchParams.get('tab')==='readme-ov-file'){
    const dest=new URL(original);dest.searchParams.delete('tab');
    options.push({id:'github',label:'GitHub',title:'移除 readme-ov-file 參數',url:dest.href});
  }
  if(host==='arxiv.org'&&/^\/(abs|pdf)\//.test(u.pathname)){
    const id=u.pathname.replace(/^\/(abs|pdf)\//,'').replace(/\.pdf$/,'');
    if(id)options.push({id:'arxiv',label:'arXiv',title:'切換 HTML 全文',url:'https://arxiv.org/html/'+id});
  }
  return options;
}
export function findRedirectOption(original, stored){
  const value=(stored||'').trim();
  return redirectOptions(original).find(x=>x.id!=='manual'&&x.url===value)?.id||'manual';
}
