'use strict';
// Creator-selected Shop Phi recommendations. Products and ads are independently
// sourced. Displayed access is not an endorsement or a product sale.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const tidy=(x,n=200)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
const URL_SCHEMES=new Set(['https:']);
function https(raw){
 let u;try{u=new URL(String(raw||''))}catch{return''}
 if(!URL_SCHEMES.has(u.protocol)||u.username||u.password)return'';
 if(/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0)$/i.test(u.hostname))return'';
 return u.href;
}
function normalize(spec={}){
 const price=Number(spec.priceStarCoins??1);
 if(!Number.isInteger(price)||price<0||price>100)throw Error('Shop Phi price must be 0–100 whole StarCoins');
 const title=tidy(spec.title||'My Curated Store',100);
 const brand=tidy(spec.creatorBrand||spec.brand||'Curated by the site owner',100);
 const raw=Array.isArray(spec.items)?spec.items:[];
 const seen=new Set(),items=[];
 for(const [idx,data] of raw.slice(0,100).entries()){
  const e=typeof data==='string'?{url:data}:data||{};
  const url=https(e.url||e.sourceUrl||e.shopUrl);
  if(!url||seen.has(url))continue;
  const name=tidy(e.title||e.name||'',130);
  if(name.length<3)continue;
  seen.add(url);
  const image=https(e.imageUrl||e.image);
  const kind=['product','advertisement','store','collection'].includes(e.kind)?e.kind:'product';
  const sponsored=e.paidPlacement===true||e.sponsored===true;
  const sourceLabel=tidy(e.seller||e.merchant||new URL(url).hostname,100);
  items.push({
   id:tidy(e.id||'selection-'+(idx+1),70),title:name,description:tidy(e.description||'',650),
   kind,sponsored,sponsor:sponsored?tidy(e.sponsor||sourceLabel,100):'',
   sourceLabel,url,image,
   priceLabel:tidy(e.priceLabel||'',55),observedAt:tidy(e.observedAt||'',55),
   affiliate:e.affiliate===true
  });
 }
 return{title,creatorBrand:brand,query:tidy(spec.query||'',140),items,
  proposedPriceStarCoins:price,creatorPayout:'awaiting_authenticated_starquest_settlement',
  shuffle:true,firstFree:true};
}
function teaser(item){
 const poster=item.image?'<img src="'+escape(item.image)+'" alt="'+escape(item.title)+'" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:contain;border-radius:12px;background:#ede8df">':'';
 const label=item.sponsored?'<strong style="font-size:12px;color:#7c401b">Sponsored · '+escape(item.sponsor)+'</strong>':'<strong style="font-size:12px;color:#4c5362">Creator-curated · not a paid placement</strong>';
 return'<article class="shopphi-feature" style="border:1px solid #e6d4a9;padding:14px;border-radius:16px;background:white;color:#212734">'+
 poster+label+'<h3>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p>'+
 (item.priceLabel?'<p><strong>Observed price:</strong> '+escape(item.priceLabel)+(item.observedAt?' · '+escape(item.observedAt):'')+'</p>':'')+
 '<p>Seller/source: '+escape(item.sourceLabel)+'</p><a href="'+escape(item.url)+'" target="_blank" rel="noopener noreferrer sponsored" style="display:inline-block;padding:10px 13px;background:#eac651;color:#231d10;border-radius:10px;font-weight:800">Open original shop or source ↗</a>'+
 (item.affiliate?'<small style="display:block">Affiliate link; the curator may earn a commission.</small>':'')+'</article>';
}
function build(spec={}){
 const m=normalize(spec),first=m.items[0],id=tidy(spec.widgetId||'shop-phi-card',64).replace(/[^A-Za-z0-9_-]/g,'')||'shop-phi-card';
 const paid=m.proposedPriceStarCoins>0;
 const view='<section id="'+escape(id)+'" class="widgetphi-shopphi" data-widgetphi-shopphi="1" style="margin:16px 0;padding:clamp(12px,4vw,24px);border:2px solid #dfad43;border-radius:20px;background:linear-gradient(150deg,#fff1bb,#f5d8b3);font-family:system-ui,sans-serif;color:#291c11">'+
 '<span style="font-size:12px;font-weight:900;letter-spacing:.12em">SHOP PHI · CURATED STORE</span>'+
 '<h2>'+escape(m.title)+'</h2><p><strong>'+escape(m.creatorBrand)+'</strong></p>'+
 '<p>Selections chosen by this curator, not matched to your personal shopping history.</p>'+
 '<div class="shopphi-current">'+(first?teaser(first):'<p>No creator-approved product or advertisement links are attached yet.</p>')+'</div>'+
 '<button type="button" disabled aria-disabled="true" data-shopphi-next style="min-height:45px;border:1px solid #6b583c;background:#eee5d5;color:#514839;padding:11px;border-radius:10px;font-weight:800">'+
 (paid?'Next curated pick · '+m.proposedPriceStarCoins+' StarCoin'+(m.proposedPriceStarCoins===1?'':'s'):'Next curated pick (not yet provisioned)')+'</button>'+
 '<p role="status" style="font-size:13px">First curated selection is free. More selections require the owner’s published catalog and a confirmed StarQuest receipt; no charge is possible in this preview.</p>'+
 '<small>Products, availability and prices belong to the original seller. Paid placement and affiliate relationships must be disclosed. This card sells curation, not third-party merchandise.</small>'+
 '</section>';
 // Later paid source URLs are intentionally absent from the public HTML.
 return view;
}
module.exports={name:'shop-phi',build,normalize};
