import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {mediaPrivate,mediaPublic} from '../cloudflare/media-star-api.mjs';

function setup(){
 const database=new DatabaseSync(':memory:');
 database.exec(readFileSync('cloudflare/catalog-schema.sql','utf8'));
 database.exec(readFileSync('workers/media-star-tenants/schema.sql','utf8'));
 const insertSite=database.prepare("INSERT INTO sites(site_id,owner_sub,title,is_published) VALUES(?,?,?,1)");
 const insertCard=database.prepare("INSERT INTO site_cards(site_id,instance_id,template_id,settings_json,public_enabled) VALUES(?,'star','media-star',?,1)");
 for(const [site,owner,price] of [['siteAlpha','owner-alpha',1],['siteBeta','owner-beta',0]]){
  insertSite.run(site,owner,'Site '+site);
  insertCard.run(site,JSON.stringify({title:'Room '+site,priceStarCoins:price}));
 }
 const prepare=sql=>({bind(...params){
  const stmt=database.prepare(sql);
  return {first:async()=>stmt.get(...params)||null,all:async()=>({results:stmt.all(...params)}),
   run:async()=>({meta:{changes:stmt.run(...params).changes}})};
 }});
 const db={prepare},card=site=>database.prepare("SELECT * FROM site_cards WHERE site_id=? AND instance_id='star'").get(site);
 const obj=site=>database.prepare('SELECT * FROM sites WHERE site_id=?').get(site);
 const call=(site,owner,action,body,method='POST')=>mediaPrivate({
   request:new Request('https://example.com',{method,...(body?{body:JSON.stringify(body)}:{})}),
   db,owner,site:obj(site),card:card(site),action
 });
 return {database,db,call};
}
test('each owner configures a separate card on shared D1 without copying source rows',async()=>{
 const {database,db,call}=setup();
 const a=await call('siteAlpha','owner-alpha','media/config');
 const b=await call('siteBeta','owner-beta','media/config');
 assert.equal((await a.json()).priceStarCoins,1);
 assert.equal((await b.json()).priceStarCoins,0);
 const source={itemId:'episode1',sourceUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',title:'Galaxy video'};
 let added=await call('siteAlpha','owner-alpha','media/items',source);
 assert.equal(added.status,201);assert.equal((await added.json()).playback,'unchecked');
 const other=await call('siteBeta','owner-beta','media/items',{...source,title:'Other user show'});
 assert.equal(other.status,201);
 assert.equal(database.prepare('SELECT COUNT(*) AS n FROM media_items').get().n,2);
 await call('siteAlpha','owner-alpha','media/items/episode1/publish');
 await call('siteBeta','owner-beta','media/items/episode1/publish');
 const pubA=await(await mediaPublic(db,'siteAlpha','star')).json();
 const pubB=await(await mediaPublic(db,'siteBeta','star')).json();
 assert.equal(pubA.items.length,1);assert.equal(pubB.items.length,1);
 assert.equal(pubA.items[0].title,'Galaxy video');
 assert.equal(pubB.items[0].title,'Other user show');
 assert.equal(pubA.paidUnlocksEnabled,false);
 database.close();
});
test('even a configured price never releases a second paid episode on the public API',async()=>{
 const {db,call,database}=setup();await call('siteAlpha','owner-alpha','media/config');
 for(const i of [1,2]){
  const r=await call('siteAlpha','owner-alpha','media/items',{
   itemId:'ep'+i,sourceUrl:'https://vimeo.com/12345678'+i,title:'One of two original episodes '+i});
  assert.equal(r.status,201);
  await call('siteAlpha','owner-alpha','media/items/ep'+i+'/publish');
 }
 const data=await(await mediaPublic(db,'siteAlpha','star')).json();
 assert.equal(data.items.length,1);
 assert.equal(data.priceStarCoins,1);
 assert.equal(data.paidUnlocksEnabled,false);
 database.close();
});
test('no unsupported schemes, fake sources, or paid checkout are accepted',async()=>{
 const {database,call}=setup();await call('siteAlpha','owner-alpha','media/config');
 for(const url of ['http://example.com/x.mp3','javascript:alert(1)','https://evil.example/random']){
  await assert.rejects(call('siteAlpha','owner-alpha','media/items',{itemId:'bad1',title:'Unverified',sourceUrl:url}),
    x=>x.status===400);
 }
 const r=await call('siteAlpha','owner-alpha','media/items',{itemId:'safe',title:'Official X Space',sourceUrl:'https://x.com/i/spaces/1OyKAjYPeXqGb'});
 assert.equal((await r.json()).provider,'x_spaces');
 const saved=database.prepare("SELECT player_mode FROM media_items WHERE item_id='safe'").get();
 assert.equal(saved.player_mode,'original_link');
 database.close();
});
test('catalog dispatcher requires owned site, owned card, then media operation',()=>{
 const api=readFileSync('cloudflare/catalog-api.mjs','utf8');
 assert.match(api,/await ownSite\(db, siteId, owner\)/);
 assert.match(api,/await ownCard\(db, siteId, instanceId\)/);
 assert.match(api,/mediaPrivate\(\{request,db,owner,site,card,action:cardAction\}\)/);
 assert.match(api,/mediaPublic\(env.CATALOG_DB,mediaMatch\[1\],mediaMatch\[2\]\)/);
 assert.doesNotMatch(readFileSync('cloudflare/media-star-api.mjs','utf8'),/star_coins\s*=|UPDATE accounts|INSERT INTO ledger_events/);
});
