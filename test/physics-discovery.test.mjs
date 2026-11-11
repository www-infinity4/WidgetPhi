import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {experiments}=require('../catalog/physics-experiments.json');
const {generatedIds}=require('../catalog/physics-built.json');
const load=()=>import('../browser/physics-discovery-data.mjs');

test('discovery includes only generated source-backed experiments, never unfinished seeds',async()=>{
 const {discoveryCards}=await load();
 const cards=discoveryCards(experiments,generatedIds);
 assert.equal(cards.length,6);
 assert.deepEqual(cards.map(x=>x.id),generatedIds);
 assert.equal(cards[0].href,'../catalog/generated/physics-001.html');
 assert.equal(cards[5].href,'../catalog/generated/physics-006.html');
 assert.ok(cards.every(x=>x.kind==='experiment' && x.sourceUrls.length));
 assert.deepEqual(discoveryCards([...experiments,{...experiments[0],id:'physics-007',number:7}],generatedIds).map(x=>x.id),generatedIds);
});

test('rejects forged ID, duplicate artifact and unsafe source URLs',async()=>{
 const {discoveryCards}=await load();
 assert.throws(()=>discoveryCards(experiments,['physics-001','physics-001']),/duplicate/i);
 assert.throws(()=>discoveryCards(experiments,['../../private']),/invalid/i);
 assert.throws(()=>discoveryCards([{...experiments[0],sources:[{url:'javascript:alert(1)',label:'bad'}]}],['physics-001']),/unsafe/i);
 assert.throws(()=>discoveryCards([{...experiments[0],id:'physics-007'}],['physics-001']),/missing/i);
});

test('historic broadcast clips are attributed and links only; no licensed stream is copied or embedded',async()=>{
 const {heritageClips}=await load();
 assert.equal(heritageClips.length,2);
 assert.ok(heritageClips.every(v=>v.credit==='ABC · Australian Screen Online' && v.kind==='archive-link' && v.href.startsWith('https://aso.gov.au/titles/tv/why-it-is-so/clip')));
 const html=readFileSync('browser/physics-discovery.html','utf8');
 const js=readFileSync('browser/physics-discovery.mjs','utf8');
 assert.match(html,/Julius Sumner Miller/);
 assert.match(html,/196|1973/);
 assert.match(html,/aria-live/);
 assert.match(html,/name="viewport"/);
 assert.match(html,/not affiliated/i);
 assert.match(js,/createElement/);
 assert.match(js,/replaceChildren/);
 assert.match(js,/rel='noopener noreferrer'/);
 assert.doesNotMatch(js,/\.innerHTML|document\.write|autoplay/);
 assert.doesNotMatch(html,/youtube\.com\/embed|aso\.gov\.au.*iframe/i);
});

test('generated cards and source hyperlinks remain accessible from relative paths',async()=>{
 const {discoveryCards}=await load();
 for(const card of discoveryCards(experiments,generatedIds)){
  assert.match(readFileSync('catalog/generated/'+card.id+'.html','utf8'),/What it demonstrates/);
  assert.ok(card.href.startsWith('../catalog/generated/'));
 }
});
