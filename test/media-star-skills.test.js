'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const curate=require('../src/media-curation'),widgets=require('../src/index');
const {DatabaseSync}=require('node:sqlite');
test('galaxy collected media invokes Add Media Star without inventing missing recordings',()=>{
 const result=curate.propose({query:'galaxy',title:'Fred Galaxy Room',collected:[
  {url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',title:'Collected video',collected:true,sourceKey:'quant-123'},
  {url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',title:'duplicate'},
  {url:'https://x.com/i/spaces/1OyKAjYPeXqGb',title:'X Space'},
  {url:'javascript:alert(1)',title:'fake'},
  {url:'https://example.com/gallery.webp',title:'Art from an external source'}
 ]});
 assert.equal(result.suggestion,'offer_add_media_star');assert.equal(result.items.length,3);
 assert.deepEqual(result.groups,{image:1,audio:1,video:1});
 assert.equal(result.items[0].sourceKey,'quant-123');
 assert.equal(result.items[1].player,'original_link');
 assert.equal(result.pricing.paidUnlocksEnabled,false);
 const noEvidence=curate.propose({query:'galaxy',collected:[]});
 assert.equal(noEvidence.suggestion,'find_sources_first');assert.deepEqual(noEvidence.items,[]);
});
test('source routing prefers official embeds; does not disguise original-source links as streams',()=>{
 assert.match(curate.source('https://youtu.be/dQw4w9WgXcQ').embed,/youtube-nocookie\.com/);
 assert.equal(curate.source('https://open.spotify.com/episode/6RUKPb4LETWmmr3iAEQktW').provider,'spotify');
 assert.equal(curate.source('https://x.com/i/spaces/1OyKAjYPeXqGb').embed,'');
 assert.equal(curate.source('https://soundcloud.com/example/episode').player,undefined);
 assert.equal(curate.source('http://unsafe.example/something.mp3'),null);
 assert.equal(curate.source('https://example.org/notmedia'),null);
 assert.equal(curate.source('https://example.org/file.mp3').mode,'direct_pending_rights');
 assert.equal(curate.normalizeRecord({url:'https://example.org/file.mp3'}).player,'original_link');
 assert.equal(curate.normalizeRecord({url:'https://example.org/file.mp3',rights:'creator_owned'}).player,'direct_media');
});
test('brandable WidgetPhi Media Star renders real sourced items without falsely enabling coin checkout',()=>{
 assert.ok(widgets.list().includes('media-star'));
 const r=widgets.handle({type:'build_widget',widget:'media-star',spec:{
 title:'My Art Galaxy',query:'galaxy',priceStarCoins:1,widgetId:'galaxy-media',
 collected:[{url:'https://vimeo.com/123456789',title:'Galaxy Documentary'}]
 }}).html;
 assert.match(r,/My Art Galaxy/);assert.match(r,/Galaxy Documentary/);
 assert.match(r,/disabled title="Creator-owned server entitlement/);
 assert.match(r,/wallet|ledger|receipt/i);assert.match(r,/data-widgetphi-media-star/);
 assert.doesNotMatch(r,/<iframe/);
 const script=fs.readFileSync('catalog/media-star-player.js','utf8');
 assert.match(script,/getRandomValues/);assert.match(script,/used=new Set/);
 assert.match(script,/provider_embed/);assert.match(script,/player==='direct_media'/);
 assert.doesNotMatch(script,/\bfetch\(/);
});
test('no repeat picker holds back used items and reports exhaustion',()=>{
 const items=[{id:'a'},{id:'b'},{id:'c'}];
 assert.equal(curate.choose(items,['a','b'],n=>0).choice.id,'c');
 assert.equal(curate.choose(items,['a','b','c'],()=>0).exhausted,true);
 assert.throws(()=>curate.propose({priceStarCoins:-1}),/whole StarCoin/);
});
test('D1 schema uses composite tenant content keys; creator receipt rows are not a debit ledger',()=>{
 const sql=fs.readFileSync('workers/media-star-tenants/schema.sql','utf8');
 const db=new DatabaseSync(':memory:');db.exec(sql);
 for(const table of ['media_sites','media_cards','media_items','media_import_receipts','media_card_rolls','media_playback_reports','media_entitlement_refs'])
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(table),table);
 db.prepare("INSERT INTO media_sites(site_id,owner_account_id,site_name,created_at) VALUES('siteA','ownerA','Galaxy',1)").run();
 db.prepare("INSERT INTO media_cards(site_id,card_id,display_name,creator_account_id,updated_at) VALUES('siteA','media','Art Gallery','ownerA',1)").run();
 db.prepare("INSERT INTO media_items(site_id,card_id,item_id,source_key,source_url,provider,media_kind,player_mode,title,updated_at) VALUES('siteA','media','item1','source1','https://example.com/x.mp3','direct','audio','original_link','Own audio',1)").run();
 assert.throws(()=>db.prepare("INSERT INTO media_items(site_id,card_id,item_id,source_key,source_url,provider,media_kind,player_mode,title,updated_at) VALUES('siteB','media','x','x','https://example.com/x.mp3','direct','audio','original_link','Fake',1)").run(),/FOREIGN KEY/);
 assert.throws(()=>db.prepare("INSERT INTO media_items(site_id,card_id,item_id,source_key,source_url,provider,media_kind,player_mode,title,updated_at) VALUES('siteA','media','item2','source1','https://example.com/x.mp3','direct','audio','original_link','Duplicate',1)").run(),/UNIQUE/);
 db.close();
});
test('the complete bot skill pack is discoverable and separates payment from card creation',()=>{
 const skills=JSON.parse(fs.readFileSync('skills/media-star-registry.json','utf8'));
 assert.equal(skills.triggers.length,5);
 for(const entry of skills.triggers){
  const file=fs.readFileSync(entry.path,'utf8');
  assert.match(file,/^---\nname:/);
  assert.match(file,/Trigger/);
 }
 assert.equal(skills.defaults.charging,'disabled_until_receipt');
 assert.ok(skills.triggers.some(x=>x.event.includes('ledger_discrepancy')));
});
