/* Pure relevance ranking; never claim an unbuilt adapter works. */
const tokenize=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(x=>x.length>1);
const t=x=>String(x??'').toLowerCase().trim();
export function score(item,query,{installed=[],history=[]}={}){
 const q=t(query),words=tokenize(query);
 if(!q)return 0;
 const id=t(item.id),name=t(item.name),tags=(item.keywords||[]).map(t);
 const corpus=t([item.name,item.id,item.description,...tags].join(' '));
 let s=0;
 if(q===name||q===id||tags.includes(q))s+=90;
 for(const tag of tags){if(q.includes(tag)&&tag.length>3)s+=Math.min(48,tag.length*3)}
 for(const word of words)if(corpus.includes(word))s+=8;
 if(words.length&&words.every(w=>corpus.includes(w)))s+=22;
 if(item.readiness==='existing')s+=22;
 else if(item.readiness==='integration')s+=4;
 else if(item.readiness==='candidate')s-=40;
 if(installed.includes(item.id))s-=12;
 if(history.length&&history.at(-1)==='search-engine'&&/reader|writer|image|viewer|media/.test(id))s+=10;
 return s;
}
export function suggest(items,query,opts={}){
 return items.filter(x=>x.active!==0).map(x=>({templateId:x.id,score:score(x,query,opts),readiness:x.readiness,name:x.name,sourceRepo:x.sourceRepo,settings:x.settings,category:x.category}))
 .filter(x=>x.score>4).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,opts.limit||12);
}
export function nextSequence(items,events=[]){
 const last=String(events.at(-1)||'');
 const flow=last==='search-engine'?['research-viewer','scholastic-reader','story-writer','image-generator','media-star']:
 last==='research-viewer'?['scholastic-reader','story-writer','image-generator','media-star']:
 last==='scholastic-reader'?['story-writer','image-generator','media-star']:
 last==='story-writer'?['image-generator','media-star','video-feed']:
 last==='image-generator'?['media-star','video-feed','infinite-stories']:
 last==='media-star'?['infinite-stories','story-writer','video-feed']:
 ['search-engine','research-viewer','story-writer','media-star'];
 const by=new Map(items.map(x=>[x.id,x]));
 return flow.filter(id=>by.has(id)).map(id=>({id,label:by.get(id).name,readiness:by.get(id).readiness,ready:by.get(id).readiness==='existing'}));
}
export function proposedRoyalties({verifiedUsage=false,founderSub=null,derivativeSub=null,originalAmountTenths=1,derivativeAmountTenths=1}={}){
 if(!verifiedUsage)return {status:'needs_verified_usage',items:[],totalTenths:0};
 const valid=x=>typeof x==='string'&&x.length>=8&&x.length<=256;
 const out=[];
 if(valid(founderSub))out.push({role:'foundation',creatorSub:founderSub,amountTenths:originalAmountTenths});
 if(valid(derivativeSub)&&derivativeSub!==founderSub)out.push({role:'derivative',creatorSub:derivativeSub,amountTenths:derivativeAmountTenths});
 if(out.some(x=>!Number.isInteger(x.amountTenths)||x.amountTenths<1))throw Error('integer tenths required');
 return {status:'awaiting_funding_and_authoritative_settlement',items:out,totalTenths:out.reduce((n,x)=>n+x.amountTenths,0),walletCredited:false};
}
