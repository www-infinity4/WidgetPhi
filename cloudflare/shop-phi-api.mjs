/* Shop Phi source publisher inside trusted WidgetPhi session.
 * Paid recommendations stay disabled until real StarQuest settlement. */
const clean=(x,n=180)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
const out=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
function error(code,message){throw Object.assign(Error(message),{status:code})}
function link(raw){
 let url;try{url=new URL(String(raw||''))}catch{return''}
 if(url.protocol!=='https:'||url.username||url.password)return'';
 if(/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0)$/i.test(url.hostname))return'';
 return url.href;
}
export async function privateShop({request,db,owner,site,card,action}){
 if(card.template_id!=='shop-phi')error(409,'shop_phi_card_required');
 const siteId=site.site_id,instanceId=card.instance_id,now=Date.now();
 if(action==='shop/config'&&request.method==='POST'){
  const settings=JSON.parse(card.settings_json||'{}');
  const price=Number(settings.priceStarCoins??1);
  if(!Number.isInteger(price)||price<0||price>100)error(400,'invalid_starcoin_price');
  const title=clean(settings.title||'My Curated Store',100);
  const creatorBrand=clean(settings.creatorBrand||'My Picks',100);
  const topic=clean(settings.query||'',140);
  const selection=String(settings.selectionMode||'no-repeat-shuffle');
  if(!['no-repeat-shuffle','owner-sequence'].includes(selection))error(400,'invalid_selection_mode');
  await db.prepare("INSERT INTO shop_phi_profiles(site_id,instance_id,creator_sub,display_name,creator_brand,topic,price_starcoins,selection_mode,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(site_id,instance_id) DO UPDATE SET display_name=excluded.display_name,creator_brand=excluded.creator_brand,topic=excluded.topic,price_starcoins=excluded.price_starcoins,selection_mode=excluded.selection_mode,updated_at=excluded.updated_at")
   .bind(siteId,instanceId,owner,title,creatorBrand,topic,price,selection,now).run();
  return out({ok:true,siteId,instanceId,title,creatorBrand,proposedPriceStarCoins:price,
   nextCheckout:'disabled_until_starquest_settlement',creatorWalletIdentity:'session_verified'});
 }
 if(action==='shop/items'&&request.method==='POST'){
  const body=await request.text();if(body.length>12000)error(413,'request_too_large');
  let d;try{d=JSON.parse(body)}catch{error(400,'invalid_json')}
  const itemId=clean(d?.itemId,80),title=clean(d?.title,130);
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(itemId)||title.length<3)error(400,'item_id_and_title_required');
  const source=link(d?.url||d?.sourceUrl),image=link(d?.imageUrl)||'';
  if(!source)error(400,'original_https_shop_source_required');
  const merchant=clean(d?.merchant||new URL(source).hostname,100);
  const kind=['product','advertisement','store','collection'].includes(d?.kind)?d.kind:'product';
  const sponsored=d?.sponsored===true||d?.paidPlacement===true;
  const sponsor=sponsored?clean(d?.sponsor||'',100):'';
  if(sponsored&&!sponsor)error(400,'sponsored_placement_must_identify_sponsor');
  const rank=Number(d?.ownerOrder??0);if(!Number.isInteger(rank)||rank<0||rank>10000)error(400,'invalid_owner_order');
  const prof=await db.prepare('SELECT creator_sub FROM shop_phi_profiles WHERE site_id=? AND instance_id=?')
   .bind(siteId,instanceId).first();
  if(!prof||prof.creator_sub!==owner)error(409,'configure_own_shop_card_first');
  const same=await db.prepare('SELECT item_id FROM shop_phi_items WHERE site_id=? AND instance_id=? AND source_url=?')
   .bind(siteId,instanceId,source).first();
  if(same&&same.item_id!==itemId)error(409,'source_already_curated');
  await db.prepare("INSERT INTO shop_phi_items(site_id,instance_id,item_id,title,description,item_kind,merchant,source_url,image_url,price_label,observed_at,sponsored,sponsor,affiliate,owner_order,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(site_id,instance_id,item_id) DO UPDATE SET title=excluded.title,description=excluded.description,item_kind=excluded.item_kind,merchant=excluded.merchant,source_url=excluded.source_url,image_url=excluded.image_url,price_label=excluded.price_label,observed_at=excluded.observed_at,sponsored=excluded.sponsored,sponsor=excluded.sponsor,affiliate=excluded.affiliate,owner_order=excluded.owner_order,state='draft'")
   .bind(siteId,instanceId,itemId,title,clean(d?.description,650),kind,merchant,source,image,
   clean(d?.priceLabel,55),clean(d?.observedAt,55),sponsored?1:0,sponsor,d?.affiliate===true?1:0,rank,now).run();
  return out({ok:true,itemId,status:'draft',originalSource:source,priceVerified:false},201);
 }
 const pub=action.match(/^shop\/items\/([A-Za-z0-9_-]{1,80})\/publish$/);
 if(pub&&request.method==='POST'){
  const row=await db.prepare("SELECT item_id,sponsored,sponsor FROM shop_phi_items WHERE site_id=? AND instance_id=? AND item_id=?")
   .bind(siteId,instanceId,pub[1]).first();
  if(!row)error(404,'shop_item_missing');
  if(row.sponsored&&!row.sponsor)error(409,'missing_advertiser_disclosure');
  await db.prepare("UPDATE shop_phi_items SET state='published' WHERE site_id=? AND instance_id=? AND item_id=?")
   .bind(siteId,instanceId,pub[1]).run();
  return out({ok:true,published:true,itemId:pub[1],starCoinsCharged:0});
 }
 if(action==='shop/items'&&request.method==='GET'){
  const rs=await db.prepare("SELECT item_id,title,description,item_kind,merchant,source_url,image_url,price_label,observed_at,sponsored,sponsor,affiliate,owner_order,state FROM shop_phi_items WHERE site_id=? AND instance_id=? ORDER BY owner_order,item_id LIMIT 100")
   .bind(siteId,instanceId).all();
  return out({items:rs.results||[],ownerAuthenticated:true});
 }
 error(404,'unknown_shop_phi_action');
}
export async function publicShop(db,siteId,instanceId){
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(siteId)||!/^[A-Za-z0-9_-]{1,80}$/.test(instanceId))error(404,'not_found');
 const p=await db.prepare("SELECT p.display_name,p.creator_brand,p.topic,p.price_starcoins,p.selection_mode,p.checkout_state FROM shop_phi_profiles p JOIN sites s ON s.site_id=p.site_id JOIN site_cards c ON c.site_id=p.site_id AND c.instance_id=p.instance_id WHERE p.site_id=? AND p.instance_id=? AND s.is_published=1 AND c.public_enabled=1 AND c.template_id='shop-phi'")
  .bind(siteId,instanceId).first();
 if(!p)error(404,'shop_phi_not_published');
 const max=p.price_starcoins>0?1:100;
 const rs=await db.prepare("SELECT item_id,title,description,item_kind,merchant,source_url,image_url,price_label,observed_at,sponsored,sponsor,affiliate FROM shop_phi_items WHERE site_id=? AND instance_id=? AND state='published' ORDER BY owner_order,item_id LIMIT ?")
  .bind(siteId,instanceId,max).all();
 return out({schema:'phi.shop-curation/public-v1',title:p.display_name,brand:p.creator_brand,topic:p.topic,
  proposedPriceStarCoins:p.price_starcoins,selectionMode:p.selection_mode,
  items:(rs.results||[]).map(r=>({...r,sponsored:!!r.sponsored,affiliate:!!r.affiliate})),
  nextPaidSelectionEnabled:false,
  checkoutStatus:p.price_starcoins>0?'awaiting_verified_creator_settlement':'free_original_sources',
  disclosure:'Curator-selected content; sponsored recommendations are labeled. Source seller controls stock, price and checkout.'});
}
