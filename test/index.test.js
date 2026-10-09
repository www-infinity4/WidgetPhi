'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const plugin = require('../src/index');

test('builds a stick ticket', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { title: '<A>', fields: ['x'] } });
  assert.match(r.html, /&#60;A&#62;/);
  assert.match(r.html, /<li>x<\/li>/);
});

test('registers stock widgets', () => {
  assert.deepEqual(plugin.list(), ['stick-ticket', 'stock-card', 'market-ticker', 'stock-wallet', 'podcast-card', 'video-feed', 'seasonal-card']);
});

test('builds an escaped stock card with provider hook', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stock-card', spec: { symbol: 'googl', exchange: 'nasdaq', company: 'Alphabet <Google>', query: 'Google stock' } });
  assert.match(r.html, /NASDAQ:GOOGL/);
  assert.match(r.html, /Alphabet &#60;Google&#62;/);
  assert.match(r.html, /data-widgetphi-tradingview="symbol-overview"/);
  assert.match(r.html, /data-phi-stock-action="collect"/);
  assert.match(r.html, /data-phi-stock-action="share"/);
});

test('rejects malformed ticker symbols', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'stock-card', spec: { symbol: '<script>' } }), /valid symbol/);
});

test('builds a market ticker', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'market-ticker', spec: { symbols: ['NASDAQ:GOOGL', { exchange: 'NASDAQ', symbol: 'MSFT', label: 'Microsoft' }] } });
  assert.match(r.html, /data-widgetphi-tradingview="ticker"/);
  assert.match(r.html, /data-config=/);
});

test('rejects unknown widget', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'nope' }));
});

test('podcast card first episode free and later access requires wallet ledger',()=>{
 const result=plugin.handle({type:'build_widget',widget:'podcast-card',spec:{
 title:'Fred Spaces',host:'Fred Krueger',priceStarCoins:3,creatorWalletId:'verified-wallet-example',
 episodes:[{title:'Bitcoin and Coffee',sourceUrl:'https://x.com/i/spaces/1OyKAjYPeXqGb'},
 {title:'A second show',sourceUrl:'https://x.com/i/spaces/1MYxNlwEqYyGw'}]}}).html;
 assert.match(result,/First episode free/);
 assert.match(result,/Next episode · 3/);
 assert.match(result,/wallet verification pending/);
 assert.match(result,/Open original episode/);
 assert.doesNotMatch(result,/<audio /);
});
test('podcast rejects unsafe sources and non-approved audio',()=>{
 assert.throws(()=>plugin.handle({type:'build_widget',widget:'podcast-card',spec:{url:'javascript:alert(1)'}}));
 assert.throws(()=>plugin.handle({type:'build_widget',widget:'podcast-card',spec:{url:'https://x.com/i/spaces/ABC',priceStarCoins:-3}}));
 assert.doesNotMatch(plugin.handle({type:'build_widget',widget:'podcast-card',spec:{url:'https://example.com/show',audioUrl:'https://example.com/audio.mp3'}}).html,/<audio /);
});

test('video feed uses privacy-enhanced YouTube playlist embed and refuses invented video',()=>{
 const widget=plugin.handle({type:'build_widget',widget:'video-feed',spec:{title:'Pujols film and history',videos:[
  {url:'https://www.youtube.com/playlist?list=PLabcdefghijklmnopqrstu123',title:'Verified Playlist'},
  {url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',title:'Known Video'},
  {url:'https://example.com/something',title:'Do not include'}
 ]}}).html;
 assert.match(widget,/youtube-nocookie.com\/embed\/videoseries/);
 assert.match(widget,/youtube-nocookie.com\/embed\/dQw4w9WgXcQ/);
 assert.match(widget,/Verified Playlist/);
 assert.doesNotMatch(widget,/Do not include/);
 assert.doesNotMatch(widget,/<iframe/);
});
