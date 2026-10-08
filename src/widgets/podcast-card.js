'use strict';

/** WidgetPhi yellow-card podcast widget. No browser-owned money movements. */
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const clean=(x,n=400)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
function https(raw){try{const u=new URL(String(raw||''));return u.protocol==='https:'?u.href:''}catch{return ''}}
function normalize(spec={}){
 const raw=Array.isArray(spec.episodes)?spec.episodes:[spec];
 const episodes=raw.slice(0,100).map((e,i)=>{
  const source=https(e.sourceUrl||e.url||e.pageUrl),media=https(e.audioUrl||e.audio||e.uploadUrl);
  if(!source&&!media)throw new Error('podcast-card requires a verified HTTPS episode or media URL');
  const fileAudio=media&&/\.(mp3|m4a|ogg|oga|wav|opus)(\?|#|$)/i.test(media);
  if(media&&!fileAudio)throw new Error('podcast-card audio must be a direct playable file; provider pages are links, not streams');
  return {id:clean(e.id||'episode-'+(i+1),80),title:clean(e.title||'Episode '+(i+1),140),
   description:clean(e.description||'',700),full:clean(e.full||e.longDescription||'',4000),
   sourceUrl:source||media,audioUrl:e.authorizedAudio===true&&fileAudio?media:'',
   imageUrl:https(e.imageUrl||e.image),duration:clean(e.duration||'',35),tags:Array.isArray(e.tags)?e.tags.map(x=>clean(x,40)).slice(0,10):[]};
 });
 if(!episodes.length)throw new Error('podcast-card requires an episode');
 const price=Number(spec.priceStarCoins??1);
 if(!Number.isInteger(price)||price<0||price>100)throw new Error('podcast-card price must be a whole StarCoin amount from 0 to 100');
 return {kind:'podcast',title:clean(spec.title||'Podcast Listening Room',160),host:clean(spec.host||spec.author||'Independent podcast',130),
  creatorWalletId:clean(spec.creatorWalletId||'',128),paymentProvider:'unified-wallet',
  walletStatus:'requires_authoritative_ledger',priceStarCoins:price,firstFree:true,
  autoplay:false,episodes,queryTerms:Array.isArray(spec.queryTerms)?spec.queryTerms.map(x=>clean(x,45)).slice(0,20):[]};
}
function build(spec={}){
 const m=normalize(spec),first=m.episodes[0],id=esc(clean(spec.widgetId||'phi-podcast',75));
 const details=first.full||first.description;
 const action=first.audioUrl?'<audio controls preload="none" style="width:100%" src="'+esc(first.audioUrl)+'"></audio>':
   '<a class="wp-source" href="'+esc(first.sourceUrl)+'" rel="noopener noreferrer" target="_blank">Open original episode / official player ↗</a>';
 const list=m.episodes.map((e,i)=>'<li data-episode="'+esc(e.id)+'">'+esc(e.title)+' · '+(i===0?'FREE':esc(m.priceStarCoins)+' ★')+'</li>').join('');
 return '<section id="'+id+'" class="widgetphi-podcast" data-widgetphi-podcast data-podcast-config="'+esc(JSON.stringify(m))+'" style="background:linear-gradient(145deg,#ffe78d,#f2c43d);color:#211800;border:2px solid #947002;padding:16px;border-radius:12px;font-family:system-ui,sans-serif">'+
  '<div style="font-size:12px;font-weight:800">YELLOW CARD · PODCAST / SPACES</div><h2>'+esc(m.title)+'</h2><p>'+esc(m.host)+'</p>'+
  (first.imageUrl?'<img src="'+esc(first.imageUrl)+'" alt="" loading="lazy" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px">':'')+
  '<h3>'+esc(first.title)+'</h3><p>'+esc(first.description||'Episode details can be filled from verified metadata or a supplied transcript.')+'</p>'+
  (first.full?'<details><summary>Read full episode description</summary><p>'+esc(details)+'</p></details>':'')+action+
  '<nav aria-label="Podcast actions" style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0"><button type="button" data-phi-podcast="star">☆ Star</button><button type="button" data-phi-podcast="share">Share</button><button type="button" data-phi-podcast="collect">Collect</button></nav>'+
  '<p><strong>First episode free</strong>. Later episodes: '+esc(m.priceStarCoins)+' full StarCoin'+(m.priceStarCoins===1?'':'s')+' each, credited to the verified creator wallet after server settlement.</p>'+
  '<ol class="wp-episodes">'+list+'</ol>'+
  '<button type="button" data-phi-podcast="next" disabled title="Waiting for verified creator-wallet settlement and playable audio">Next episode · '+esc(m.priceStarCoins)+' ★ (wallet verification pending)</button>'+
  '<p class="wp-status" role="status">Your Unified Wallet is required for paid listening. This preview cannot charge or mint StarCoins.</p>'+
  '</section>';
}
module.exports={name:'podcast-card',normalize,build};
