/**
 * WidgetPhi public card runtime (browser only).
 * Mount with WidgetPhiCatalog.mount(element, manifest, {siteId,apiBase}).
 * Uses the host's published data; does not issue payments or store identities.
 */
(function(global){
'use strict';
const dom=(type,text,cls)=>{const el=document.createElement(type);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el};
const append=(parent,child)=>{parent.appendChild(child);return child};
const text=(value,n=400)=>String(value==null?'':value).slice(0,n);
const https=url=>{try{const u=new URL(String(url));return u.protocol==='https:'?u.href:''}catch{return ''}};
const css=`
.widgetphi-site{font-family:system-ui,sans-serif;color:inherit}
.widgetphi-site .wp-card{border:1px solid #8c7ab5;border-radius:15px;margin:14px 0;padding:17px;background:var(--widgetphi-surface,#f8f5ff);color:var(--widgetphi-text,#211832);overflow-wrap:anywhere}
.widgetphi-site .wp-card h2{font-size:1.3rem;margin:0 0 10px}
.widgetphi-site .wp-card h3{font-size:1.1rem}
.widgetphi-site .wp-card input{width:100%;padding:12px;border:1px solid #8168a8;border-radius:8px}
.widgetphi-site .wp-card button{min-height:44px;margin:7px 5px 7px 0;padding:9px 13px;border-radius:10px;background:#3e286a;color:#fff;border:0;cursor:pointer}
.widgetphi-site .wp-card :focus-visible{outline:3px solid #ad7100;outline-offset:2px}
.widgetphi-site .wp-item{border-top:1px solid #b9a8cf;padding:12px 0}
.widgetphi-site .wp-muted{font-size:.91rem;color:#554667}
.widgetphi-site .wp-source{display:block;margin:8px 0;overflow-wrap:anywhere}
`;
function styleOnce(){
 if(document.getElementById('widgetphi-catalog-style'))return;
 const tag=append(document.head,dom('style'));tag.id='widgetphi-catalog-style';tag.textContent=css;
}
function notice(el,message){append(el,dom('p',message,'wp-muted'));}
function safeApi(options){
 const base=options&&options.apiBase?String(options.apiBase).replace(/\/$/,''):global.location.origin;
 try{const url=new URL(base,global.location.href);return url.protocol==='https:'||url.hostname==='localhost'?url.origin:''}catch{return ''}
}
function renderSource(article,url){
 const link=https(url);if(!link)return;
 const a=append(article,dom('a','Open cited source ↗','wp-source'));a.href=link;a.target='_blank';a.rel='noopener noreferrer';
}
function resultArticle(root,item){
 const article=append(root,dom('article',undefined,'wp-item'));
 append(article,dom('h3',text(item.title,180)));
 if(item.summary)append(article,dom('p',text(item.summary,1200)));
 if(item.body) {
   const detail=append(article,dom('details'));append(detail,dom('summary','Read on this website'));
   append(detail,dom('p',text(item.body,12000)));
 }
 renderSource(article,item.sourceUrl);
 return article;
}
function broadcast(root,item){
 const event=new CustomEvent('widgetphi:research-open',{detail:{title:text(item.title,180),
 summary:text(item.summary,1200),body:text(item.body,12000),sourceUrl:https(item.sourceUrl),instanceId:text(item.instanceId,80)}});
 root.dispatchEvent(event);
}
function renderResults(target,items,root){
 target.replaceChildren();
 if(!Array.isArray(items)||!items.length){notice(target,'No published matching results in this website yet.');return;}
 for(const item of items){
  const row=resultArticle(target,item);
  const b=append(row,dom('button','Open in Research Viewer'));b.type='button';
  b.addEventListener('click',()=>broadcast(root,item));
 }
}
function reader(card,instance,options,root){
 const settings=instance.settings||{};
 if(settings.access==='paid'){notice(card,'Paid reader selected. Listening or reading requires a server-confirmed wallet entitlement; this public card cannot unlock content.');return;}
 if(!options.siteId){notice(card,'A published site ID is required to load its unique content database.');return;}
 const list=append(card,dom('div',undefined,'wp-reader-list'));
 const api=safeApi(options);if(!api){notice(list,'Reader API is not configured.');return;}
 const url=api+'/public/sites/'+encodeURIComponent(options.siteId)+'/cards/'+encodeURIComponent(instance.instanceId)+'/content';
 fetch(url).then(r=>{if(!r.ok)throw new Error('Reader is unavailable');return r.json()}).then(data=>renderResults(list,data.items,root))
 .catch(()=>notice(list,'The reader could not load published items from the site database.'));
}
function search(card,instance,options,root){
 const s=instance.settings||{};
 const mode=s.mode||'quanta-style';
 const form=append(card,dom('form'));const label=append(form,dom('label','Search this website'));
 const input=append(form,dom('input'));input.type='search';input.required=true;input.minLength=2;input.maxLength=120;input.placeholder='What would you like to research?';label.htmlFor=input.id='wp-search-'+instance.instanceId;
 const b=append(form,dom('button','Search'));b.type='submit';
 notice(card,'Mode: '+mode+'. Local published research is searched here; AI overviews and image-first ranking require an authorized search provider connection.');
 const results=append(card,dom('div',undefined,'wp-search-results'));const api=safeApi(options);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const query=input.value.trim();if(query.length<2)return;results.replaceChildren();
  if(!options.siteId||!api){notice(results,'Publish this website and connect its site search endpoint first.');return;}
  notice(results,'Searching published website content…');
  try{
   const u=api+'/public/sites/'+encodeURIComponent(options.siteId)+'/search?q='+encodeURIComponent(query);
   const resp=await fetch(u);if(!resp.ok)throw new Error('search unavailable');
   const data=await resp.json();renderResults(results,data.items,root);
   root.dispatchEvent(new CustomEvent('widgetphi:research-search',{detail:{instanceId:instance.instanceId,query,mode}}));
  }catch{results.replaceChildren();notice(results,'Search could not load. No outside provider has been silently framed.');}
 });
}
function viewer(card,instance,root){
 const panel=append(card,dom('div',undefined,'wp-viewer-content'));
 notice(panel,'Select “Open in Research Viewer” on a search result or reader entry.');
 root.addEventListener('widgetphi:research-open',event=>{
  const item=event.detail;if(!item)return;panel.replaceChildren();
  const title=append(panel,dom('h3',text(item.title,180)));
  title.tabIndex=-1;
  if(item.summary)append(panel,dom('p',text(item.summary,1200)));
  if(item.body)append(panel,dom('p',text(item.body,12000)));
  renderSource(panel,item.sourceUrl);
  title.focus();
 });
}
function templateStarter(card,instance,options,root){
 const settings=instance.settings||{},index=String(settings.index||settings.siteIndex||'');
 const topics=[...new Set(index.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,24);
 notice(card,'Reusable card starter. Your website owns these topics; custom feature behavior awaits a tested WidgetPhi adapter.');
 if(topics.length){
  const label=append(card,dom('h3','Your topics'));
  const list=append(card,dom('ul'));
  for(const topic of topics){const li=append(list,dom('li'));append(li,dom('span',text(topic,100)));}
 }
 search(card,{...instance,settings:{...settings,mode:'links-only'}},options,root);
}
function mount(root,manifest,options={}){
 if(!root||typeof root.appendChild!=='function')throw new Error('Mount target required');
 if(!manifest||manifest.schema!=='widgetphi.site'||!Array.isArray(manifest.cards))throw new Error('WidgetPhi site manifest required');
 styleOnce();root.replaceChildren();root.classList.add('widgetphi-site');
 for(const instance of manifest.cards.slice(0,80)){
  if(!instance||!instance.cardId||!instance.instanceId)continue;
  const settings=instance.settings||{};
  const card=append(root,dom('section',undefined,'wp-card'));card.dataset.widgetphiCard=instance.cardId;
  append(card,dom('h2',text(settings.title||instance.cardId,150)));
  switch(instance.cardId){
   case 'search-engine':search(card,instance,options,root);break;
   case 'research-viewer':viewer(card,instance,root);break;
   case 'scholastic-reader':case 'asteroid-reads':case 'infinite-stories':
     reader(card,instance,options,root);break;
   case 'story-writer':
     notice(card,'Original story generation needs a connected, consent-based Phi writer endpoint.');break;
   case 'infinity-radio':
     notice(card,'Connect authorized station recordings using the existing Infinity Radio integration.');break;
   case 'media-star':case 'podcast-card':case 'video-feed':
     notice(card,'Connect verified provider episodes or authorized uploads through this card adapter.');break;
   default:if(instance.cardId==='stock-card'||instance.cardId==='market-ticker'){
      notice(card,'Connect the existing WidgetPhi '+instance.cardId+' adapter in Code Phi.');
     }else templateStarter(card,instance,options,root);break;
  }
 }
 return root;
}
async function autoMount(){
 for(const root of document.querySelectorAll('[data-widgetphi-manifest]')){
  try{
   const url=root.getAttribute('data-widgetphi-manifest');
   const resp=await fetch(url);if(!resp.ok)throw new Error('Manifest not available');
   await mount(root,await resp.json(),{siteId:root.getAttribute('data-site-id')||'',
    apiBase:root.getAttribute('data-api-base')||global.location.origin});
  }catch(error){root.textContent='WidgetPhi cards unavailable: '+error.message;}
 }
}
global.WidgetPhiCatalog={mount,autoMount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',autoMount,{once:true});else autoMount();
})(window);
