import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {privateShop,publicShop} from '../cloudflare/shop-phi-api.mjs';
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(readFileSync('cloudflare/catalog-schema.sql','utf8'));
 sqlite.exec(readFileSync('cloudflare/shop-phi-schema.sql','utf8'));
 const db={prepare:sql=>({bind(...args){const s=sqlite.prepare(sql);return{
  first:async()=>s.get(...args)||null,all:async()=>({results:s.all(...args)}),run:async()=>({meta:s.run(...args)})
 }}})};
 for(const [id,owner] of [['one','owner-creator-one'],['two','owner-creator-two']]){
  sqlite.prepare('INSERT INTO sites(site_id,owner_sub,title,is_published) VALUES(?,?,?,1)').run(id,owner,'Creator '+id);
  sqlite.prepare("INSERT INTO site_cards(site_id,instance_id,template_id,settings_json,public_enabled) VALUES(?,'store','shop-phi',?,1)").run(id,JSON.stringify({title:'Store '+id,creatorBrand:'Curator '+id,priceStarCoins:1}));
 }
 const owned=(site,owner,action,body=null,method='POST')=>privateShop({
  request:new Request('https://example.org/'+action,{method,...(body?{body:JSON.stringify(body)}:{})}),
  db,owner,site:sqlite.prepare('SELECT * FROM sites WHERE site_id=?').get(site),
  card:sqlite.prepare("SELECT * FROM site_cards WHERE site_id=? AND instance_id='store'").get(site),
  action
 });
 return {db,sqlite,owned};
}
test('owner-created Shop Phi catalogs remain separate in shared Cloudflare D1',async()=>{
 const {db,sqlite,owned}=fixture();
 const a=await owned('one','owner-creator-one','shop/config');
 const b=await owned('two','owner-creator-two','shop/config');
 assert.equal((await a.json()).nextCheckout,'disabled_until_starquest_settlement');
 assert.equal(b.status,200);
 const first=await owned('one','owner-creator-one','shop/items',{
  itemId:'art1',title:'Galaxy collection',url:'https://shop.example.org/galaxy',
  kind:'advertisement',sponsored:true,sponsor:'Example Art Seller',ownerOrder:1
 });
 assert.equal(first.status,201);
 const another=await owned('two','owner-creator-two','shop/items',{itemId:'art1',title:'Different seller',url:'https://shop2.example.com/galaxy'});
 assert.equal(another.status,201);
 await owned('one','owner-creator-one','shop/items/art1/publish');
 await owned('two','owner-creator-two','shop/items/art1/publish');
 const pub1=await(await publicShop(db,'one','store')).json();
 const pub2=await(await publicShop(db,'two','store')).json();
 assert.equal(pub1.items.length,1);assert.equal(pub2.items.length,1);
 assert.equal(pub1.brand,'Curator one');assert.equal(pub2.brand,'Curator two');
 assert.equal(pub1.items[0].sponsor,'Example Art Seller');
 assert.equal(pub2.items[0].sponsor,'');
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM shop_phi_entitlement_refs').get().n,0);
 sqlite.close();
});
test('paid Shop Phi shows only first curator-approved offer, never hidden sources',async()=>{
 const {db,sqlite,owned}=fixture();
 await owned('one','owner-creator-one','shop/config');
 for(const i of [1,2]){
  const r=await owned('one','owner-creator-one','shop/items',{itemId:'p'+i,title:'Curated recommendation '+i,url:'https://example.org/product/'+i,ownerOrder:i});
  assert.equal(r.status,201);
  await owned('one','owner-creator-one','shop/items/p'+i+'/publish');
 }
 const response=await publicShop(db,'one','store');
 const json=await response.json();
 assert.equal(json.items.length,1);
 assert.equal(json.items[0].item_id,'p1');
 assert.equal(json.nextPaidSelectionEnabled,false);
 assert.equal(json.proposedPriceStarCoins,1);
 assert.doesNotMatch(JSON.stringify(json),/product\/2/);
 sqlite.close();
});
test('sponsored items must disclose sponsor and cannot publish unsafe links',async()=>{
 const {owned,sqlite}=fixture();
 await owned('one','owner-creator-one','shop/config');
 await assert.rejects(owned('one','owner-creator-one','shop/items',{itemId:'x',title:'Paid advert',url:'https://example.org/x',sponsored:true}),e=>e.status===400);
 await assert.rejects(owned('one','owner-creator-one','shop/items',{itemId:'x',title:'Unsafe URL',url:'javascript:alert(1)'}),e=>e.status===400);
 await assert.rejects(owned('one','owner-creator-one','shop/items',{itemId:'x',title:'Unsafe URL',url:'https://localhost/asset'}),e=>e.status===400);
 await owned('one','owner-creator-one','shop/items',{itemId:'art',title:'Original art link',url:'https://example.org/art',ownerOrder:3});
 await assert.rejects(owned('one','owner-creator-one','shop/items',{itemId:'again',title:'Duplicate link',url:'https://example.org/art'}),e=>e.status===409);
 sqlite.close();
});
test('Shop Phi profile cannot steal a configured creator wallet when card display is renamed',async()=>{
 const {owned,sqlite}=fixture();
 await owned('one','owner-creator-one','shop/config');
 await assert.rejects(owned('one','owner-creator-attacker','shop/config'),e=>e.status===403);
 const profile=sqlite.prepare("SELECT creator_sub FROM shop_phi_profiles WHERE site_id='one'").get();
 assert.equal(profile.creator_sub,'owner-creator-one');
 await assert.rejects(owned('one','owner-creator-attacker','shop/items',{itemId:'attack',title:'Fake advert',url:'https://example.org/ad'}),e=>e.status===409);
 sqlite.close();
});
