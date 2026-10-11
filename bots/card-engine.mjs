/**
 * WidgetPhi request engine.
 * Turns untrusted feature requests into bounded, reviewable catalog templates,
 * never executable remote code, automatic payouts, or production deploys.
 */
const CATEGORIES = Object.freeze(['Search & Research','Reading & Stories','Media & Entertainment','Markets & Utilities']);
const REPOS = Object.freeze([
 'QuantaPhi','Infinity-Phi','InfinityPhi','Omni-Phi','Code-Phi','Create-Phi',
 'Web-Phi','News-Phi','Media-Star','Infinity-Radio','Moltnook','DesiPhi','WidgetPhi',
 'C13b0','TV-Database','Builder-Reserve'
]);
const TYPES = Object.freeze(['text','textarea','boolean','number','select']);
const SAFE = /^[a-z][a-z0-9-]{1,62}$/;
const BLOCK = /(secret|password|token|private.key|wallet.payment|credential|oauth|api.key)/i;
const ESCAPES = /[\u0000-\u001f\u007f]/g;
const plain = (v,max) => String(v??'').replace(ESCAPES,' ').trim().slice(0,max);
export const SOURCE_REPOSITORIES = REPOS.map(repo=>'www-infinity4/'+repo);
export const sourcePathAllowed = (path) =>
 typeof path==='string' && path.length<180 &&
 /\.(?:html|css|js|mjs|ts|tsx|jsx)$/.test(path) &&
 !/(^|\/)(?:\.github|node_modules|dist|build|coverage|test|tests|vendor)\/|\.min\.js$/.test(path) &&
 /(card|viewer|search|story|radio|reader|article|media|player|upload|builder|index|image)/i.test(path);

export function slugify(value){
 const s=plain(value,140).replace(/([a-z\d])([A-Z])/g,'$1-$2').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56).replace(/-$/,'');
 return s.length>1&&SAFE.test(s)?s:null;
}
function normalizeSetting(v) {
 if(!v || typeof v!=='object' || Array.isArray(v)) throw Error('Setting object required');
 const key=slugify(v.key||'');
 if(!key || BLOCK.test(key)) throw Error('Unsafe setting key');
 const type=plain(v.type,20);
 if(!TYPES.includes(type)) throw Error('Unsupported setting type');
 const label=plain(v.label||key,80);
 if(!label || BLOCK.test(label)) throw Error('Unsafe setting label');
 const out={key,label,type};
 if(type==='select'){
  if(!Array.isArray(v.options)||v.options.length<2||v.options.length>12)throw Error('Select needs 2-12 options');
  const choices=v.options.map(x=>plain(x,70));
  if(choices.some(x=>!x)||new Set(choices).size!==choices.length)throw Error('Invalid select options');
  if(!choices.includes(v.default)) throw Error('Select default must be an option');
  out.options=choices;out.default=v.default;
 }else if(type==='boolean'){
  if(typeof v.default!=='boolean')throw Error('Boolean default required');
  out.default=v.default;
 }else if(type==='number'){
  const min=Number(v.min??0),max=Number(v.max??100);
  if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<0||max>10000||min>max)throw Error('Invalid numeric bounds');
  if(!Number.isInteger(v.default)||v.default<min||v.default>max)throw Error('Invalid numeric default');
  out.min=min;out.max=max;out.default=v.default;
 }else{
  const value=plain(v.default||'',type==='textarea'?4000:500);
  if(BLOCK.test(value))throw Error('Secrets are not card settings');
  out.default=value;
 }
 return out;
}
export function normalizeRequest(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Request object required');
 const kind=plain(raw.kind,18);
 if(!['new','enhance','discover'].includes(kind))throw Error('Unsupported request type');
 const name=plain(raw.name,100),description=plain(raw.description,1300);
 if(!name||description.length<12)throw Error('Card name and useful description required');
 if(BLOCK.test(name))throw Error('Unsafe card name');
 const proposedId=slugify(raw.cardId||name);
 if(!proposedId)throw Error('Invalid card ID or name');
 const category=CATEGORIES.includes(raw.category)?raw.category:'Search & Research';
 const setting=raw.setting===undefined||raw.setting===null?null:normalizeSetting(raw.setting);
 const origin=raw.source && typeof raw.source==='object'?raw.source:{};
 const repo=plain(origin.repo,100),sha=plain(origin.sha,50),path=plain(origin.path,180);
 if(repo && !SOURCE_REPOSITORIES.includes(repo))throw Error('Unapproved source repo');
 if(sha && !/^[a-f0-9]{40}$/.test(sha))throw Error('Source SHA must be immutable');
 if(path && !sourcePathAllowed(path))throw Error('Unapproved source path');
 if((sha||path)&&(!repo||!sha||!path))throw Error('Complete source repo, SHA and path required');
 const issueNumber=Number(raw.issueNumber);
 const issue=Number.isSafeInteger(issueNumber)&&issueNumber>0&&issueNumber<1e8?issueNumber:null;
 if(!issue&&!sha)throw Error('A GitHub issue or immutable source commit is required');
 return {schema:'widgetphi.card-request',version:1,kind,name,cardId:proposedId,
  category,description,setting,issueNumber:issue,source:repo?{repo,sha,path}:null,
  requestedBy:plain(raw.requestedBy,80)||'phi-card-bot'};
}
export function requestFromIssue(issue){
 if(!issue || typeof issue!=='object'||typeof issue.title!=='string')throw Error('GitHub issue required');
 const title=issue.title.trim(),match=title.match(/^\[Card (New|Enhance)\]\s+(.{2,100})$/i);
 if(!match) return null;
 const body=String(issue.body||'');
 const marker=body.match(/<!--\s*widgetphi-card-request-v1\s*([\s\S]*?)\s*-->/);
 if(!marker)throw Error('Issue missing bounded WidgetPhi request payload');
 if(marker[1].length>6000)throw Error('Payload too large');
 let raw;try{raw=JSON.parse(marker[1]);}catch{throw Error('Invalid request JSON');}
 const kind=match[1].toLowerCase()==='new'?'new':'enhance';
 if(raw.kind!==kind)throw Error('Issue title and request kind do not match');
 return normalizeRequest({...raw,name:match[2],issueNumber:issue.number,requestedBy:issue.user?.login||'github-user'});
}
export function requestFromSource(source){
 if(!sourcePathAllowed(source.path))return null;
 const repo=source.repo||'';
 if(!SOURCE_REPOSITORIES.includes(repo))return null;
 const label=source.path.split('/').pop().replace(/\.[^.]+$/,'').replace(/[-_.]/g,' ');
 // Keep source discoveries as proposals: model/human must select the actual card.
 return normalizeRequest({kind:'discover',name:label+' candidate',
   description:'Inspect recently changed '+source.path+' for a reusable Phi card or enhancement; preserve working site behavior.',
   category:'Search & Research',source:{repo,sha:source.sha,path:source.path},requestedBy:'widgetphi-source-scout'});
}
function defaultFields(name){
 return [{key:'title',label:'Card name',type:'text',default:name},
  {key:'index',label:'Owner content and topic index',type:'textarea',default:''}];
}
export function applyRequest(catalog,raw){
 const request=normalizeRequest(raw);
 if(!catalog||!Array.isArray(catalog.cards))throw Error('Catalog unavailable');
 const ids=catalog.cards.map(x=>x.id);
 const jobId=request.issueNumber?'issue-'+request.issueNumber:'source-'+request.source.sha.slice(0,12)+'-'+request.cardId;
 const job={schema:'widgetphi.card-build-job',version:1,jobId,request,
  state:'requires-build-review',codeGenerated:false,tested:false,deployed:false,paid:false,
  handoff:{blue:'Validate source, tenant data and reusable setting schema',
   green:'Implement and integrate card logic in WidgetPhi before publishing',
   pink:'Test accessibility, callbacks and regressions',
   purple:'Approve documented evidence and release'}};
 if(request.kind==='discover')return {catalog,job,changed:false,reason:'source-discovery'};
 if(request.kind==='new'){
  if(ids.includes(request.cardId))return {catalog,job,changed:false,reason:'card-exists'};
  const entry={id:request.cardId,name:request.name,category:request.category,
   source:request.source?.repo||'WidgetPhi user request',readiness:'template',
   summary:request.description.slice(0,260),settings:defaultFields(request.name)};
  if(request.setting&&!entry.settings.some(x=>x.key===request.setting.key))entry.settings.push(request.setting);
  return {...{catalog:{...catalog,cards:[...catalog.cards,entry]},job},changed:true,reason:'new-template'};
 }
 if(!ids.includes(request.cardId))return {catalog,job,changed:false,reason:'missing-existing-card'};
 const original=catalog.cards.find(x=>x.id===request.cardId);
 if(!request.setting)return {catalog,job,changed:false,reason:'needs-engineering'};
 if(original.settings.some(s=>s.key===request.setting.key))return {catalog,job,changed:false,reason:'existing-setting'};
 const modified={...original,settings:[...original.settings,request.setting]};
 return {catalog:{...catalog,cards:catalog.cards.map(x=>x.id===original.id?modified:x)},job,changed:true,reason:'new-setting'};
}
