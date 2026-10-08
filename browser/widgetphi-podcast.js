/* WidgetPhi podcast browser runtime. Evidence events, never fabricated wallet credits. */
(function(global){
 'use strict';
 if(global.__WidgetPhiPodcastBound)return;
 global.__WidgetPhiPodcastBound=true;
 const setStatus=(card,msg)=>{const e=card.querySelector('.wp-status');if(e)e.textContent=msg};
 const episodeSource=card=>card.querySelector('.wp-source')?.href||location.href;
 document.addEventListener('click',async event=>{
  const control=event.target.closest('[data-phi-podcast]');
  const card=control?.closest('[data-widgetphi-podcast]');
  if(!card)return;
  const action=control.dataset.phiPodcast,source=episodeSource(card);
  if(action==='star'){
   control.dataset.starred=control.dataset.starred==='true'?'false':'true';
   control.textContent=control.dataset.starred==='true'?'★ Starred':'☆ Star';
   card.dispatchEvent(new CustomEvent('phi:podcast:star',{detail:{starred:control.dataset.starred==='true'},bubbles:true}));
   setStatus(card,'Favorite saved for this session. No StarCoin minted.');
  }
  if(action==='share'){
   try{
    if(navigator.share)await navigator.share({title:card.querySelector('h3')?.textContent||'Podcast',url:source});
    else if(navigator.clipboard)await navigator.clipboard.writeText(source);
    else throw Error('Sharing unavailable');
    card.dispatchEvent(new CustomEvent('phi:podcast:share-evidence',{detail:{source},bubbles:true}));
    setStatus(card,'Shared. A reward is issued only after Infinity ledger verification.');
   }catch{setStatus(card,'Share canceled or unavailable; no reward was issued.')}
  }
  if(action==='collect'){
   card.dispatchEvent(new CustomEvent('phi:podcast:collect-request',{detail:{source},bubbles:true}));
   setStatus(card,'Collect requested. Unified Wallet must confirm collection and reward.');
  }
 });
 document.addEventListener('ended',event=>{
  const card=event.target.closest('[data-widgetphi-podcast]');
  if(!card)return;
  card.dispatchEvent(new CustomEvent('phi:podcast:episode-completed',{detail:{source:episodeSource(card)},bubbles:true}));
  setStatus(card,'Episode complete. Paid continuation requires a separate verified receipt.');
 },true);
 document.addEventListener('toggle',event=>{
  const card=event.target.closest('[data-widgetphi-podcast]');
  if(card&&event.target.matches('details')&&!event.target.open){
   card.dispatchEvent(new CustomEvent('phi:podcast:description-closed',{bubbles:true}));
  }
 },true);
})(window);
