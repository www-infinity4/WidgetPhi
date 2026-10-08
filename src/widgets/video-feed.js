'use strict';
/* WidgetPhi sourced video gallery, official provider embeds only. */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function media(raw){
 let u;try{u=new URL(raw)}catch{return null}
 if(u.protocol!=='https:')return null;
 const host=u.hostname.toLowerCase().replace(/^www\./,'');let id,embed,provider;
 if(['youtube.com','m.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)){
  const playlist=u.searchParams.get('list');
  if(playlist&&u.pathname==='/playlist'&&/^[A-Za-z0-9_-]{12,80}$/.test(playlist)){
   id=playlist;provider='YouTube playlist';embed='https://www.youtube-nocookie.com/embed/videoseries?list='+encodeURIComponent(id);
  }else{
   id=host==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|live|embed)\/([^/]+)/)?.[1];
   if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return null;
   provider='YouTube';embed='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
  }
 }else if(['vimeo.com','player.vimeo.com'].includes(host)){
  id=u.pathname.match(/\/(?:video\/)?(\d{5,12})/)?.[1];
  if(!id)return null;provider='Vimeo';embed='https://player.vimeo.com/video/'+id;
 }else if(host==='archive.org'){
  id=u.pathname.match(/\/(?:details|embed)\/([A-Za-z0-9._-]+)/)?.[1];
  if(!id)return null;provider='Internet Archive';embed='https://archive.org/embed/'+encodeURIComponent(id);
 }else return null;
 return {id,embed,provider,url:u.href};
}
function build(spec={}){
 const raw=Array.isArray(spec.videos)?spec.videos:[];
 const seen=new Set(),items=[];
 for(const x of raw.slice(0,60)){
  const m=media(x?.url||x?.sourceUrl||x);
  if(!m||seen.has(m.provider+':'+m.id))continue;
  seen.add(m.provider+':'+m.id);
  items.push({...m,title:String(x?.title||m.provider+' video').trim().slice(0,150)});
 }
 const title=String(spec.title||'Watch').slice(0,120);
 return '<section class="widgetphi-video-feed" data-widgetphi-video-feed>'+
  '<h2>'+esc(title)+'</h2><div class="wp-videos" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px">'+
  items.map(v=>'<article style="border:1px solid #d8c6de;padding:12px;border-radius:15px"><h3>'+esc(v.title)+'</h3><div class="wp-player">'+
  '<button type="button" data-widgetphi-video="'+esc(v.embed)+'" style="width:100%;min-height:170px;background:#202035;color:white;border-radius:13px;border:0">▶ Watch '+esc(v.provider)+'</button></div>'+
  '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(v.url)+'">Original video ↗</a></p></article>').join('')+
  '</div>'+(items.length?'':'<p>No verified video sources are attached to this website yet.</p>')+'</section>';
}
module.exports={name:'video-feed',media,build};
