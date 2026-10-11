/* Media Star catalog publisher: trusted-session creator writes, public free reads.
 * This module neither debits StarCoins nor copies provider media. */
function source(raw){
 let u;try{u=new URL(String(raw||''))}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password)return null;
 const host=u.hostname.toLowerCase().replace(/^www\./,''),path=u.pathname;
 let provider='',kind='',mode='original_link',id='';
 if(['youtube.com','m.youtube.com','youtu.be'].includes(host)){
  id=host==='youtu.be'?path.slice(1):u.searchParams.get('v')||path.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return null;provider='youtube';kind='video';mode='provider_embed';
 }else if(['vimeo.com','player.vimeo.com'].includes(host)){
  id=path.match(/\/(?:video\/)?(\d{5,13})(?:\/|$)/)?.[1];if(!id)return null;provider='vimeo';kind='video';mode='provider_embed';
 }else if(host==='open.spotify.com'){
  const m=path.match(/^\/(episode|track|show)\/([A-Za-z0-9]{22})(?:\/|$)/);if(!m)return null;
  id=m[2];provider='spotify';kind='audio';mode='provider_embed';
 }else if(host==='x.com'||host==='twitter.com'){
  const m=path.match(/^\/i\/spaces\/([A-Za-z0-9]{10,25})\/?$/);if(!m)return null;
  id=m[1];provider='x_spaces';kind='audio';
 }else if(/\.(png|jpe?g|webp|avif|gif)$/i.test(path)){id=u.href;provider='image';kind='image'}
 else if(/\.(mp3|m4a|ogg|oga|wav|opus|aac)$/i.test(path)){id=u.href;provider='direct';kind='audio'}
 else if(/\.(mp4|webm|ogv)$/i.test(path)){id=u.href;provider='direct';kind='video'}
 else return null;
 return {url:u.href,sourceKey:(provider+':'+id).slice(0,200),provider,kind,mode};
}
const text=(v,n)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
const idOk=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x);
const fail=(status,reason)=>{throw Object.assign(new Error(reason),{status})};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function mediaPrivate({request,db,owner,site,card,action}){
 if(card.template_id!=='media-star')fail(409,'media_star_card_required');
 const cardId=card.instance_id,siteId=site.site_id,now=Date.now();
 if(action==='media/config'&&request.method==='POST'){
  const setting=JSON.parse(card.settings_json||'{}');
  const name=text(setting.title||'My Media Star',100),price=Number(setting.priceStarCoins||0);
  if(!Number.isInteger(price)||price<0||price>100)fail(400,'invalid_price');
  await db.prepare("INSERT OR IGNORE INTO media_sites(site_id,owner_account_id,site_name,created_at) VALUES(?,?,?,?)").bind(siteId,owner,site.title,now).run();
  await db.prepare("INSERT INTO media_cards(site_id,card_id,display_name,settings_json,price_starcoins,creator_account_id,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(site_id,card_id) DO UPDATE SET display_name=excluded.display_name,settings_json=excluded.settings_json,price_starcoins=excluded.price_starcoins,updated_at=excluded.updated_at").bind(siteId,cardId,name,JSON.stringify(setting),price,owner,now).run();
  return respond({ok:true,siteId,cardId,priceStarCoins:price,paidCheckout:'disabled_until_verified_settlement'});
 }
 if(action==='media/items'&&request.method==='POST'){
  const payload=await request.text();if(payload.length>14000)fail(413,'request_too_large');
  let input;try{input=JSON.parse(payload)}catch{fail(400,'invalid_json')}
  const ref=source(input?.sourceUrl||input?.url);
  if(!ref)fail(400,'original_supported_source_required');
  const id=text(input?.itemId,80),title=text(input?.title,170);
  if(!idOk(id)||title.length<3)fail(400,'source_title_or_item_id_required');
  const cardRow=await db.prepare('SELECT card_id FROM media_cards WHERE site_id=? AND card_id=? AND creator_account_id=?').bind(siteId,cardId,owner).first();
  if(!cardRow)fail(409,'configure_media_star_first');
  const existing=await db.prepare('SELECT item_id FROM media_items WHERE site_id=? AND card_id=? AND source_key=?').bind(siteId,cardId,ref.sourceKey).first();
  if(existing&&existing.item_id!==id)fail(409,'duplicate_source_url');
  await db.prepare("INSERT INTO media_items(site_id,card_id,item_id,source_key,source_url,provider,media_kind,player_mode,title,description,rights_state,playback_state,visibility,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,'needs_review','unchecked','draft',?) ON CONFLICT(site_id,card_id,item_id) DO UPDATE SET source_key=excluded.source_key,source_url=excluded.source_url,provider=excluded.provider,media_kind=excluded.media_kind,player_mode=excluded.player_mode,title=excluded.title,description=excluded.description,rights_state='needs_review',playback_state='unchecked',visibility='draft',updated_at=excluded.updated_at").bind(siteId,cardId,id,ref.sourceKey,ref.url,ref.provider,ref.kind,ref.mode,title,text(input?.description,650),now).run();
  return respond({ok:true,itemId:id,provider:ref.provider,status:'draft',playback:'unchecked'},201);
 }
 const match=action.match(/^media\/items\/([A-Za-z0-9_-]+)\/publish$/);
 if(match&&request.method==='POST'){
  const id=match[1],item=await db.prepare('SELECT item_id,player_mode FROM media_items WHERE site_id=? AND card_id=? AND item_id=?').bind(siteId,cardId,id).first();
  if(!item)fail(404,'media_not_found');
  if(!['provider_embed','original_link'].includes(item.player_mode))fail(403,'direct_media_rights_review_required');
  await db.prepare("UPDATE media_items SET visibility='published',updated_at=? WHERE site_id=? AND card_id=? AND item_id=?").bind(now,siteId,cardId,id).run();
  return respond({ok:true,published:true,itemId:id});
 }
 if(action==='media/items'&&request.method==='GET'){
  const rows=await db.prepare('SELECT item_id,title,provider,media_kind,source_url,player_mode,rights_state,playback_state,visibility FROM media_items WHERE site_id=? AND card_id=? ORDER BY updated_at DESC LIMIT 100').bind(siteId,cardId).all();
  return respond({items:rows.results||[]});
 }
 fail(404,'unknown_media_action');
}
export async function mediaPublic(db,siteId,cardId){
 if(!idOk(siteId)||!idOk(cardId))fail(404,'not_found');
 const row=await db.prepare("SELECT m.price_starcoins AS price FROM media_cards m JOIN sites s ON s.site_id=m.site_id JOIN site_cards c ON c.site_id=m.site_id AND c.instance_id=m.card_id WHERE m.site_id=? AND m.card_id=? AND s.is_published=1 AND c.public_enabled=1 AND c.template_id='media-star'").bind(siteId,cardId).first();
 if(!row)fail(404,'not_published');
 const max=row.price>0?1:100;
 const items=await db.prepare("SELECT item_id,title,provider,media_kind,source_url,player_mode,playback_state FROM media_items WHERE site_id=? AND card_id=? AND visibility='published' ORDER BY updated_at DESC LIMIT ?").bind(siteId,cardId,max).all();
 return respond({items:items.results||[],paidUnlocksEnabled:false,priceStarCoins:row.price,limitation:row.price>0?'Only the free preview is public; paid records need a signed entitlement':'Playback is controlled by the original provider'});
}
