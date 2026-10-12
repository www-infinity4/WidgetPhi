/* WidgetPhi Media Star public renderer. No payment, mint, or third-party
 * access token ever runs here; a paying server must supply entitlement. */
(function(root){
'use strict';
function mount(card){
 if(!card||card.dataset.phiMediaBound==='1')return;
 const stage=card.querySelector('[data-phi-media-stage]'),
       status=card.querySelector('[data-phi-media-status]'),
       button=card.querySelector('[data-phi-media-action="roll"]');
 if(!stage||!status||!button)return;
 let data;try{data=JSON.parse(card.dataset.phiManifest||'{}')}catch{return}
 if(data?.schema!=='phi.media-star.collection/v1'||!Array.isArray(data.items))return;
 card.dataset.phiMediaBound='1';
 let used=new Set(),previewCount=0;
 const person=card.querySelector('[data-phi-media-person]');
 person?.addEventListener('change',()=>{stage.replaceChildren();status.textContent='Choose Next recording to play '+(person.value||'anyone')+'.'});
 const freeOnly=data.pricing?.paidUnlocksEnabled!==true;
 const priced=Number(data.pricing?.proposedStarCoins||0)>0;
 const elem=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
 const sourceLink=item=>{const a=elem('a','Open original source ↗');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';return a};
 function render(item){
  stage.replaceChildren();
  stage.append(elem('h3',item.title));
  if(item.description)stage.append(elem('p',item.description));
  if(item.playback!=='tested_playing'){
   stage.append(elem('p','Source indexed; playback has not been tested for this device.'));
  }
  const valid=(url)=>{try{return new URL(url).protocol==='https:'}catch{return false}};
  if(item.player==='provider_embed'&&valid(item.embed)){
   const player=elem('button','▶ Load official '+item.provider+' player');
   player.type='button';player.addEventListener('click',()=>{
    const frame=elem('iframe');frame.src=item.embed;frame.title=item.title+' official media player';
    frame.loading='lazy';frame.referrerPolicy='no-referrer';
    frame.setAttribute('allow','encrypted-media; fullscreen; picture-in-picture');
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');
    frame.style='display:block;width:100%;min-height:300px;border:0;border-radius:12px;background:#15122a';
    player.replaceWith(frame);
   });stage.append(player);
  }else if(item.player==='direct_media'&&valid(item.url)){
   const medium=elem(item.kind==='video'?'video':'audio');
   medium.src=item.url;medium.controls=true;medium.preload='none';
   if(item.kind==='video')medium.playsInline=true;
   medium.style='display:block;max-width:100%;width:100%;max-height:420px';
   stage.append(medium);
  }else if(item.player==='image_original'&&item.rights==='approved'&&valid(item.url)){
   const image=elem('img');image.src=item.url;image.alt=item.title;image.loading='lazy';
   image.style='width:100%;max-height:440px;object-fit:contain';stage.append(image);
  }
  if(valid(item.url))stage.append(sourceLink(item));
 }
 button.addEventListener('click',()=>{
  if(!data.items.length){status.textContent='No approved source links attached yet.';return}
  if(freeOnly&&priced&&previewCount>0){status.textContent='Free preview used. Another paid selection requires creator-verified settlement; no StarCoins were charged.';return}
  const recordings=data.items.filter(x=>!person?.value||x.creatorLabel===person.value);
  if(!recordings.length){status.textContent='No recordings attached for this person yet.';return}
  let pool=recordings.filter(x=>!used.has(x.id));
  if(!pool.length){for(const x of recordings)used.delete(x.id);pool=recordings.slice()}
  const max=4294967296,ceiling=Math.floor(max/pool.length)*pool.length;
  const v=new Uint32Array(1);let n;
  if(!root.crypto?.getRandomValues){status.textContent='Secure random selection unavailable on this device.';return}
  do{root.crypto.getRandomValues(v);n=v[0]}while(n>=ceiling);
  const item=pool[n%pool.length];used.add(item.id);previewCount++;
  render(item);status.textContent='Curated source selected. No charge made. '+(priced?'Further paid selections need a server-confirmed entitlement.':'Continue to shuffle without repeating.');
 });
}
function start(){document.querySelectorAll('[data-widgetphi-media-star]').forEach(mount)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
root.WidgetPhiMediaStar=Object.freeze({mount});
})(window);
