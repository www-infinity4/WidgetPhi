/* WidgetPhi Halloween event bridge. Audio/video begin only after a click. */
(function(root){
 'use strict';
 if(root.__WidgetPhiSeasonalBound)return;root.__WidgetPhiSeasonalBound=true;
 var dismissKey='widgetphi:halloween:dismiss:',active=new WeakMap();
 function inSeason(d){return d.getMonth()===9;}
 function chooseMode(counts) {
  var map={video:'video',videos:'video',music:'sound',audio:'sound',sounds:'sound',images:'art',image:'art',art:'art',games:'game',game:'game',history:'vintage',vintage:'vintage',stories:'story',story:'story',costumes:'costume'};
  var best='game',score=0;
  Object.keys(counts||{}).forEach(function(k){var m=map[k.toLowerCase()],n=Number(counts[k]);if(m&&Number.isFinite(n)&&n>score){best=m;score=n;}});
  return best;
 }
 function status(n,s){var el=n.querySelector('.ph-result');if(el)el.textContent=s;}
 function stop(n){var a=active.get(n);if(a){try{a.osc.stop();a.ctx.close();}catch(e){}active.delete(n);}}
 function sound(n){
  stop(n);var API=root.AudioContext||root.webkitAudioContext;
  if(!API){status(n,'Audio not supported here.');return;}
  var ctx=new API(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(460,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(85,ctx.currentTime+1.4);
  gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.15,ctx.currentTime+.08);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.4);
  osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+1.42);active.set(n,{osc:osc,ctx:ctx});
  osc.onended=function(){ctx.close();active.delete(n);};status(n,'Playing a ghostly synthesizer sound…');
 }
 var costumes=['clockwork vampire','haunted librarian','moonlit astronomer','forest witch','ghost pirate','pumpkin astronaut'];
 var details=['with silver face paint','with a starry cape','carrying a glowing lantern','holding an ancient map','wearing antique boots','with glowing goggles'];
 var stories=['An empty lighthouse lit itself for the first time in forty years.','At midnight the old radio announced tomorrow’s news.','A pumpkin in the field whispered a name everyone had forgotten.','Every night, the portrait revealed one more open door.'];
 function event(n,type){n.dispatchEvent(new CustomEvent('phi:seasonal:'+type,{bubbles:true,detail:{widget:'seasonal-card',mode:n.dataset.phMode,id:n.dataset.phId,requested:true}}));}
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-ph-action]');if(!b)return;
  var n=b.closest('[data-widgetphi-seasonal]');if(!n)return;
  var kind=b.dataset.phAction;
  if(kind==='close'){stop(n);try{root.sessionStorage.setItem(dismissKey+n.dataset.phId,'1');}catch(e){}n.hidden=true;event(n,'dismiss');}
  if(kind==='door'){var surprises=['a golden pumpkin! 🎃','a friendly ghost! 👻','a mysterious black cat! 🐈‍⬛'];status(n,'Behind the door: '+surprises[Math.floor(Math.random()*surprises.length)]);}
  if(kind==='sound')sound(n);
  if(kind==='stop'){stop(n);status(n,'Sound stopped.');}
  if(kind==='costume')status(n,'Try a '+costumes[Math.floor(Math.random()*costumes.length)]+' '+details[Math.floor(Math.random()*details.length)]+'.');
  if(kind==='story')status(n,stories[Math.floor(Math.random()*stories.length)]);
  if(kind==='video'){
   var src=b.dataset.phEmbed||'';
   if(!/^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|archive\.org\/embed\/)/.test(src)){status(n,'Invalid media source.');return;}
   var f=document.createElement('iframe');f.src=src;f.title='Halloween screening';f.loading='lazy';f.referrerPolicy='strict-origin-when-cross-origin';f.allow='fullscreen; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.style.cssText='width:100%;min-height:220px;aspect-ratio:16/9;border:0;border-radius:12px';b.replaceWith(f);
  }
  if(kind==='star'||kind==='collect'){event(n,kind);status(n,'Request sent to the host. Wallet rewards require server verification.');}
  if(kind==='share'){
   event(n,'share');var data={title:n.querySelector('h2').textContent,url:root.location.href};
   if(root.navigator&&root.navigator.share)root.navigator.share(data).catch(function(){});
   else if(root.navigator&&root.navigator.clipboard)root.navigator.clipboard.writeText(data.url).then(function(){status(n,'Link copied.');}).catch(function(){status(n,'Share this page: '+data.url);});
   else status(n,'Share this page: '+data.url);
  }
 });
 function scan(scope,opts){
  opts=opts||{};
  (scope||document).querySelectorAll('[data-widgetphi-seasonal]').forEach(function(n){
   if(n.dataset.phSeasonal==='1'&&!opts.preview&&!inSeason(new Date())){n.hidden=true;return;}
   try{if(n.dataset.phPopup==='1'&&root.sessionStorage.getItem(dismissKey+n.dataset.phId)==='1')n.hidden=true;}catch(e){}
  });
 }
 root.WidgetPhiSeasonal={inSeason:inSeason,chooseMode:chooseMode,scan:scan};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){scan();});else scan();
})(window);