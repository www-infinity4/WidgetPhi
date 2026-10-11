'use strict';
// Search/Collect -> per-owner Media Star draft. No payments or guessed media.
const {randomInt} = require('node:crypto');
const text=(x,n=200)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
function source(raw){
 let u;try{u=new URL(String(raw||''))}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password)return null;
 if(/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(u.hostname))return null;
 const h=u.hostname.toLowerCase().replace(/^www\./,'');
 let provider='',kind='',embed='',stream='',id='',mode='original_link';
 if(['youtube.com','m.youtube.com','youtu.be','youtube-nocookie.com'].includes(h)){
   id=h==='youtu.be'?u.pathname.split('/')[1]:u.searchParams.get('v')||u.pathname.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)?.[1];
   if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return null;
   provider='youtube';kind='video';embed='https://www.youtube-nocookie.com/embed/'+id;mode='provider_embed';
 }else if(['vimeo.com','player.vimeo.com'].includes(h)){
   id=u.pathname.match(/\/(?:video\/)?(\d{5,13})(?:\/|$)/)?.[1];if(!id)return null;
   provider='vimeo';kind='video';embed='https://player.vimeo.com/video/'+id;mode='provider_embed';
 }else if(h==='open.spotify.com'){
   const match=u.pathname.match(/^\/(episode|show|track|album)\/([A-Za-z0-9]{22})(?:\/|$)/);if(!match)return null;
   provider='spotify';kind='audio';id=match[2];
   embed='https://open.spotify.com/embed/'+match[1]+'/'+id;mode='provider_embed';
 }else if(h==='soundcloud.com'){
   provider='soundcloud';kind='audio';id=u.pathname;mode='original_link';
 }else if(h==='x.com'||h==='twitter.com'){
   const match=u.pathname.match(/^\/i\/spaces\/([A-Za-z0-9]{10,25})\/?$/);if(!match)return null;
   provider='x_spaces';kind='audio';id=match[1];mode='original_link';
 }else if(h==='archive.org'){
   const match=u.pathname.match(/^\/(?:details|embed)\/([A-Za-z0-9._-]+)(?:\/|$)/);
   if(!match)return null;provider='internet_archive';kind='video';id=match[1];
   embed='https://archive.org/embed/'+encodeURIComponent(id);mode='provider_embed';
 }else if(/\.(mp3|m4a|ogg|oga|opus|wav|aac)(?:$)/i.test(u.pathname)){
   provider='direct';kind='audio';id=u.href;mode='direct_pending_rights';
 }else if(/\.(mp4|webm|ogv)(?:$)/i.test(u.pathname)){
   provider='direct';kind='video';id=u.href;mode='direct_pending_rights';
 }else if(/\.(jpg|jpeg|png|webp|avif|gif)(?:$)/i.test(u.pathname)){
   provider='image';kind='image';id=u.href;mode='image_original';
 }else{return null}
 return {url:u.href,provider,kind,id,embed,mode,playback:'unchecked'};
}
function normalizeRecord(item,i=0){
 const data=typeof item==='string'?{url:item}:item||{};
 const link=source(data.sourceUrl||data.url||data.href||'');if(!link)return null;
 const id=text(data.id||link.provider+':'+link.id,180);
 // Lack of license means no direct stream, even when a file URL looks usable.
 const permission=data.rights==='creator_owned'||data.rights==='licensed_embed'?'approved':'needs_review';
 const player=link.mode==='direct_pending_rights' && permission==='approved'?'direct_media':
   link.mode==='direct_pending_rights'?'original_link':link.mode;
 return {...link,id,title:text(data.title||data.sourceTitle||data.alt||'Sourced media '+(i+1),160),
  description:text(data.description||data.summary||'',700),mediaType:link.kind,
  collected:!!data.collected,rights:permission,playback:data.playbackStatus==='tested_playing'?'tested_playing':'unchecked',
  player,creatorLabel:text(data.creatorLabel||data.creator||'',100),
  sourceKey:text(data.sourceKey||data.researchId||'',130),licenseEvidence:text(data.licenseEvidence||'',350)};
}
function propose({query='',collected=[],sources=[],title='My Media Star',priceStarCoins=1}={}){
 const q=text(query,200),input=[...collected,...sources];
 const seen=new Set(),items=[];
 for(const [i,e] of input.slice(0,300).entries()){
  const c=normalizeRecord(e,i);
  if(!c||seen.has(c.provider+'|'+c.id))continue;
  seen.add(c.provider+'|'+c.id);items.push(c);
 }
 const price=Number(priceStarCoins);if(!Number.isInteger(price)||price<0||price>100)throw Error('Price must be a whole StarCoin from 0 to 100');
 const groups={image:0,audio:0,video:0};for(const x of items)groups[x.kind]++;
 const relevant=items.some(x=>x.collected)||/galax|music|audio|radio|video|space|astronom|art|film|gallery|podcast|episode/i.test(q);
 return {schema:'phi.media-star.collection/v1',title:text(title,100),query:q,items,groups,
  suggestion:relevant&&items.length>0?'offer_add_media_star':relevant?'find_sources_first':'optional',
  pricing:{proposedStarCoins:price,mode:'disabled_until_creator_ledger_verified',paidUnlocksEnabled:false},
  sourcePolicy:'only provider-native embeds or original links; direct files require rights',
  dataScope:'site_and_creator'};
}
// Choose without repeating within a specific owner's previous picks.
// Weighted sources are *per item*, never from misleading provider result counts.
function choose(items,seen=[],rng=randomInt){
 const candidates=items.filter(x=>!seen.includes(x.id));
 if(!candidates.length)return {choice:null,exhausted:true};
 return {choice:candidates[rng(candidates.length)],exhausted:false};
}
module.exports={source,normalizeRecord,propose,choose};
