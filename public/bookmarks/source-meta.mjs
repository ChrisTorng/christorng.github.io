// Render only the source domain and first path segment, without exposing query strings.
export function sourceInfo(value) {
 try {
  const url=new URL(value);
  if(!['http:','https:'].includes(url.protocol))return null;
  const segment=url.pathname.split('/').filter(Boolean)[0]||'';
  let readable=segment;
  try{readable=decodeURIComponent(segment);}catch{}
  return {
   host:url.hostname,
   label:url.hostname+(readable?'/'+readable:''),
   icon:'https://www.google.com/s2/favicons?domain='+encodeURIComponent(url.hostname)+'&sz=32'
  };
 }catch{return null;}
}
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sourceBadge(value) {
 const source=sourceInfo(value);
 if(!source)return '';
 return '<span class="bookmark-site" title="'+escapeHtml(source.label)+'">'+
  '<img src="'+escapeHtml(source.icon)+'" width="16" height="16" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'+
  '<span class="site-label">'+escapeHtml(source.label)+'</span></span>';
}
