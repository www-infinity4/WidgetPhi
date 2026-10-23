// Issue intake is an attributed-data transport, not a crawler or publisher.
// A supplied publisher URL must never become a fabricated news item.
export function parseIssueFeed(body) {
  const lines=String(body||'').split(/\r?\n/);
  const start=lines.findIndex(line=>/^Feed JSON:\s*$/i.test(line.trim()));
  if(start===-1)return null;
  if(!/^\`{3}(?:json)?\s*$/i.test((lines[start+1]||'').trim()))
    return {error:'Feed JSON must be followed by a fenced JSON object'};
  const end=lines.findIndex((line,i)=>i>start+1&&/^\`{3}\s*$/.test(line.trim()));
  if(end<0)return {error:'Feed JSON block is missing a closing fence'};
  const input=lines.slice(start+2,end).join('\n');
  if(!input.trim()||input.length>14000)return {error:'Feed JSON must contain at most 14,000 characters'};
  let value;
  try{value=JSON.parse(input)}catch{return {error:'Feed JSON is not valid JSON'}}
  if(!value||typeof value!=='object'||Array.isArray(value)||
     !Array.isArray(value.items)||value.items.length<1||value.items.length>50)
    return {error:'Feed JSON requires 1–50 attributed items'};
  if(value.topics!==undefined&&(!Array.isArray(value.topics)||value.topics.length>20))
    return {error:'Feed topics must be an array of at most 20 labels'};
  if(value.seenUrls!==undefined&&(!Array.isArray(value.seenUrls)||value.seenUrls.length>100))
    return {error:'Seen URLs must be an array of at most 100 links'};
  const string=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
  const items=[];
  for(const raw of value.items){
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||
       !string(raw.url,2048)||!string(raw.title,200)||
       !string(raw.source,100)||!string(raw.publishedAt,60))
      return {error:'Each feed item requires a URL, title, source and publication date'};
    let u;
    try{u=new URL(raw.url)}catch{return {error:'Feed items require HTTPS source links'}}
    if(u.protocol!=='https:'||u.username||u.password)
      return {error:'Feed items require HTTPS source links without embedded credentials'};
    if(raw.topics!==undefined&&(!Array.isArray(raw.topics)||raw.topics.length>20))
      return {error:'Item topics must be an array of at most 20 labels'};
    items.push({url:u.href,title:string(raw.title,200),source:string(raw.source,100),
      publishedAt:string(raw.publishedAt,60),summary:string(raw.summary,1200),
      topics:(raw.topics||[]).map(x=>string(x,70)).filter(Boolean),
      relevance:typeof raw.relevance==='number'&&Number.isFinite(raw.relevance)?Math.max(0,Math.min(1,raw.relevance)):0});
  }
  return {feed:{items,topics:(value.topics||[]).map(x=>string(x,70)).filter(Boolean),
    seenUrls:(value.seenUrls||[]).map(x=>string(x,2048)).filter(Boolean)}};
}
