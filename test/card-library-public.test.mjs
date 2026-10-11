import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{ranked} from '../workers/card-library-public/worker.mjs';
const items=[
 {template_id:'market-ticker',display_name:'Market Ticker',category:'Markets & Utilities',description:'Live configured stock ticker',source_repo:'www-infinity4/WidgetPhi',source_path:'src/widgets/market-ticker.js',readiness:'existing',settings_json:'[{"key":"index","default":"NASDAQ:GOOGL"}]',keywords_json:'["stocks","stock ticker","symbols"]'},
 {template_id:'news-phi',display_name:'News Phi',category:'Search & Research',description:'News feed planned',source_repo:'www-infinity4/News-Phi',source_path:'',readiness:'candidate',settings_json:'[]',keywords_json:'["news"]'},
 {template_id:'media-star',display_name:'Media Star',category:'Media & Entertainment',description:'Personal audio gallery',source_repo:'www-infinity4/WidgetPhi',source_path:'src/widgets/media-star.js',readiness:'template',settings_json:'[]',keywords_json:'["media","music"]'}
];
const db={prepare(sql){
 return {all:async()=>({results:items}),bind(id){return{first:async()=>items.find(x=>x.template_id===id)||null}}};
}};
const call=(path,method='GET',data=db)=>worker.fetch(new Request('https://worker.test'+path,{method}),{CATALOG_DB:data});
test('ticker ranks above candidate and retains configurable settings',async()=>{
 const r=await call('/v1/cards?q=stock%20ticker');
 assert.equal(r.status,200);
 const d=await r.json();
 assert.equal(d.cards[0].id,'market-ticker');
 assert.equal(d.cards[0].readyToEmbed,true);
 assert.equal(d.cards[0].settings[0].key,'index');
 assert.ok(d.totalIndexed===3);
});
test('candidate remains clearly not installable and no wallet data exposed',async()=>{
 const d=await(await call('/v1/cards?q=news')).json();
 assert.equal(d.cards[0].id,'news-phi');
 assert.equal(d.cards[0].readyToEmbed,false);
 assert.doesNotMatch(JSON.stringify(d),/owner_sub|creator_wallet|starcoins_balance/i);
});
test('read-only API refuses mutation and missing DB',async()=>{
 const r=await call('/v1/cards','POST');
 assert.equal(r.status,405);
 const h=await call('/health','GET',null);
 assert.equal(h.status,503);
 const a=await call('/v1/cards/unknown');
 assert.equal(a.status,404);
 const ok=await call('/v1/cards/market-ticker');
 assert.equal((await ok.json()).card.name,'Market Ticker');
});
test('working cards get explicit readiness boost',()=>{
 assert.ok(ranked(items[0],'stock ticker')>ranked(items[1],'stock ticker'));
});
