import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const catalog=require('../catalog/cards.json');
const {plan,symbolsFrom,semanticTerms}=require('../catalog/personal-requests.js');
test('ordinary language selects registered private card without inventing a stock ticker',()=>{
 const p=plan('I want a stock player on my QuantaPhi',catalog.cards);
 assert.equal(p.cardId,'stock-card');assert.equal(p.status,'needs-input');
 assert.deepEqual(p.symbols,[]);assert.equal(p.settings.index,catalog.cards.find(x=>x.id==='stock-card').settings.find(x=>x.key==='index').default);
 assert.match(p.reason,/No company was guessed/i);
});
test('explicit tickers bind to existing adapter and preserve original context',()=>{
 const p=plan('Add a market ticker for NASDAQ:AAPL,NYSE:IBM',catalog.cards);
 assert.equal(p.cardId,'market-ticker');assert.equal(p.status,'configured');
 assert.deepEqual(p.symbols,['NASDAQ:AAPL','NYSE:IBM']);
 assert.equal(p.settings.index,'NASDAQ:AAPL,NYSE:IBM');
});
test('media, story, viewer and search use existing registry',()=>{
 for(const [prompt,id] of [['I need a music player','media-star'],['Make a story writer','story-writer'],
 ['Add a research viewer','research-viewer'],['Create a search engine','search-engine']]){
  assert.equal(plan(prompt,catalog.cards).cardId,id);
 }
});
test('unknown request routes to adapter review, never blind generation or payment',()=>{
 const x=plan('Make me an antigravity quantum waffle teleporter',catalog.cards);
 assert.equal(x.status,'needs-adapter');assert.equal(x.cardId,undefined);
 assert.ok(x.terms.includes('waffle'));
});
test('blocks overly long input and rejects phantom symbols',()=>{
 assert.equal(plan('x'.repeat(801),catalog.cards).status,'invalid');
 assert.deepEqual(symbolsFrom('Build a stock card'),[]);
 assert.deepEqual(symbolsFrom('Stocks: $TSLA and NASDAQ:AAPL'),['TSLA','NASDAQ:AAPL']);
 assert.ok(semanticTerms('Create my favorite stock cards about aerospace').includes('aerospace'));
});
