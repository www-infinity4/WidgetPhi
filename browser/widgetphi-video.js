/* Video player loads only when the listener asks to watch. */
(function(root){
 'use strict';
 if(root.__WidgetPhiVideoBound)return;root.__WidgetPhiVideoBound=true;
 document.addEventListener('click',e=>{
  const control=e.target.closest('[data-widgetphi-video]');
  if(!control)return;
  const src=control.dataset.widgetphiVideo;
  if(!/^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|archive\.org\/embed\/)/.test(src||''))return;
  const frame=document.createElement('iframe');frame.src=src;frame.title=control.closest('article')?.querySelector('h3')?.textContent||'Original video';
  frame.width='560';frame.height='315';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.allow='accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
  frame.style.cssText='width:100%;max-width:100%;aspect-ratio:16/9;border:0;border-radius:12px';
  control.replaceWith(frame);
 });
})(window);
