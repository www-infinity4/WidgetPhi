import {discoveryCards,heritageClips} from './physics-discovery-data.mjs';

const byId=id=>document.getElementById(id);
const node=(tag,cls,value)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(value!==undefined)el.textContent=String(value);
 return el;
};
const link=(label,href)=>{
 const el=node('a','',label);el.href=href;el.target='_blank';el.rel='noopener noreferrer';return el;
};
let mode='archive';
let index=0;
let verifiedExperiments=[];

function selectedCards(){return mode==='archive'?heritageClips:verifiedExperiments;}
function updateTabControls(){
 byId('show-archive').setAttribute('aria-pressed',String(mode==='archive'));
 byId('show-experiments').setAttribute('aria-pressed',String(mode==='experiments'));
}
function render(){
 const cards=selectedCards(),root=byId('content'),counter=byId('counter');
 root.replaceChildren();updateTabControls();
 if(!cards.length){
  counter.textContent='No verified experiment preview available';
  root.append(node('p','detail','No published experiment records are available for this source. Try the historical film links.'));
  byId('prev').disabled=byId('next').disabled=true;
  return;
 }
 index=(index+cards.length)%cards.length;
 const card=cards[index];
 counter.textContent=(mode==='archive'?'Historical clip ':'Original experiment ')+(index+1)+' of '+cards.length;
 root.append(node('h2','',card.title),node('p','detail',card.description));
 if(mode==='archive'){
  root.append(node('p','tags',card.credit+' · '+card.year+' · '+card.duration));
  const notice=node('p','archive','Historical video is hosted by the original archive. Open the archival page to view it under the publisher’s terms. No video file is embedded or copied.');
  const actions=node('div','actions');actions.append(link('View original archival clip',card.href));
  root.append(notice,actions);
 }else{
  root.append(node('p','tags','Guide: '+card.character));
  const frame=node('iframe','');
  frame.title=card.title+' · original Infinity experiment';
  frame.src=card.href;frame.loading='lazy';
  frame.setAttribute('sandbox','allow-same-origin');
  root.append(frame);
  const actions=node('div','actions');
  for(const source of card.sourceUrls)actions.append(link('Scientific source: '+source.label,source.url));
  root.append(actions);
 }
 byId('prev').disabled=cards.length<2;
 byId('next').disabled=cards.length<2;
}
function setMode(next){
 if(mode===next)return;
 mode=next;index=0;render();
}
byId('show-archive').addEventListener('click',()=>setMode('archive'));
byId('show-experiments').addEventListener('click',()=>setMode('experiments'));
byId('prev').addEventListener('click',()=>{index-=1;render()});
byId('next').addEventListener('click',()=>{index+=1;render()});
document.addEventListener('keydown',event=>{
 if(event.target?.matches?.('input,textarea,select,[contenteditable]'))return;
 if(event.key==='ArrowLeft'&&selectedCards().length>1){index-=1;render();}
 if(event.key==='ArrowRight'&&selectedCards().length>1){index+=1;render();}
});
render();

async function loadPublished(){
 try{
  const [seedResponse,builtResponse]=await Promise.all([
   fetch(new URL('../catalog/physics-experiments.json',import.meta.url),{cache:'no-store'}),
   fetch(new URL('../catalog/physics-built.json',import.meta.url),{cache:'no-store'})
  ]);
  if(!seedResponse.ok||!builtResponse.ok)throw Error('Verified catalog not available');
  const [seed,built]=await Promise.all([seedResponse.json(),builtResponse.json()]);
  if(seed.schema!=='widgetphi.physics-seed/v1'||built.schema!=='widgetphi.physics-built/v1')throw Error('Unrecognized catalog version');
  verifiedExperiments=discoveryCards(seed.experiments,built.generatedIds);
  if(mode==='experiments')render();
 }catch(error){
  verifiedExperiments=[];
  const note=node('p','note','Experiment archive is unavailable until the reviewed catalog and preview files are served together. Historical links remain available.');
  byId('content').append(note);
 }
}
loadPublished();
