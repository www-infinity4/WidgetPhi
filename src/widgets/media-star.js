'use strict';
const curate=require('../media-curation');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function build(spec={}){
 const draft=curate.propose(spec),id=String(spec.widgetId||'media-star-personal').replace(/[^a-z0-9_-]/gi,'').slice(0,64)||'media-star';
 const locked=Number(draft.pricing.proposedStarCoins)>0;
 return '<section id="'+esc(id)+'" data-widgetphi-media-star class="widgetphi-media-star"'+
 ' data-phi-manifest="'+esc(JSON.stringify(draft))+'"'+
 ' style="border:2px solid #e1bd53;border-radius:22px;background:linear-gradient(120deg,#fff6c9,#e6d8ff);color:#2d203a;padding:18px;font-family:system-ui,sans-serif">'+
 '<small>✦ MEDIA STAR · CUSTOM CURATION</small><h2>'+esc(draft.title)+'</h2>'+
 '<label>Choose a person <select data-phi-media-person aria-label="Media Star person"><option value="">Everyone</option>'+
 [...new Set([...draft.items.map(x=>x.creatorLabel),...(Array.isArray(spec.following)?spec.following.map(x=>typeof x==='string'?x:String(x.name||x.handle||'')):[])].filter(Boolean))].map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select></label>'+
 '<div data-phi-media-stage role="region" aria-label="Current selected media">'+
 '<p>Select a sourced episode, artwork, video, or audio clip.</p></div>'+
 '<div style="display:flex;flex-wrap:wrap;gap:8px">'+
 '<button type="button" data-phi-media-action="roll" style="min-height:44px;padding:10px 15px">▶ Next recording</button>'+
 '<button type="button" data-phi-media-action="unlock" disabled title="Creator-owned server entitlement has not been connected" style="min-height:44px;padding:10px 15px">'+(locked?'Unlock next · '+draft.pricing.proposedStarCoins+' StarCoin(s)':'Paid unlocks disabled')+'</button></div>'+
 '<p data-phi-media-status role="status">Free preview ready. Paid unlocks require a real creator ledger and receipt; they are disabled in this template.</p>'+
 '<details><summary>Research & source index · '+draft.items.length+' items</summary><ol>'+
 draft.items.map((x,i)=>'<li>'+esc(x.title)+' · '+esc(x.provider)+' · '+
 '<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Original source</a>'+
 (i===0?' · Preview source':'')+'</li>').join('')+'</ol></details>'+
 '</section>';
}
module.exports={name:'media-star',build,normalize:curate.propose};
