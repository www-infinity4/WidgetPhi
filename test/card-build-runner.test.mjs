import test from 'node:test';
import assert from 'node:assert/strict';
import {requestFromIssue,build,preview} from '../bots/card-build-engine.mjs';
const issue=(title,body,number=100)=>({title:'[Card Build] '+title,body,number,user:{login:'www-infinity4'}});
test('bot turns user-specified symbols into existing functional stock ticker',()=>{
 const r=requestFromIssue(issue('My stock page','Title: My Stock Watch\nSymbols: NASDAQ:AAPL,NASDAQ:MSFT'));
 const a=build(r);
 assert.equal(a.status,'built');
 assert.equal(a.widget,'market-ticker');
 assert.match(a.html,/data-widgetphi-tradingview="ticker"/);
 const config=JSON.parse(decodeURIComponent(a.html.match(/data-config="([^"]+)"/)[1]));
 assert.deepEqual(config.symbols.map(x=>x.proName),['NASDAQ:AAPL','NASDAQ:MSFT']);
 assert.match(preview(a),/widgetphi-stock.js/);
 assert.equal(a.paid,false);
});
test('stock request missing symbols returns a clear blocker not an invented ticker',()=>{
 const req=requestFromIssue(issue('Stock prices','Please make an amazing ticker'));
 assert.equal(build(req).status,'needs_source_data');
 assert.equal(requestFromIssue({title:'[Card New] Another',body:'Create a widget'}),null);
 const unsafe=requestFromIssue(issue('Stocks','Symbols: <script>alert(1)</script>'));
 assert.equal(build(unsafe).status,'needs_source_data');
});
test('video bot generates provider-backed video and rejects random unrelated URLs',()=>{
 const req=requestFromIssue(issue('Video feed','Please use my video feed\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ'));
 const a=build(req);
 assert.equal(a.widget,'video-feed');
 assert.equal(a.status,'built');
 assert.match(a.html,/youtube-nocookie.com/);
 assert.match(preview(a),/widgetphi-video.js/);
 const bad=build(requestFromIssue(issue('Video feed','Watch these videos https://example.org/not-a-movie')));
 assert.equal(bad.status,'needs_source_data');
});
test('Media Star curation bot uses only supplied source URLs and leaves checkout disabled',()=>{
 const req=requestFromIssue(issue('My Media Star','Media Star collection\nhttps://x.com/i/spaces/1OyKAjYPeXqGb'));
 const a=build(req);
 assert.equal(a.status,'built');
 assert.equal(a.widget,'media-star');
 assert.match(a.html,/Original source/);
 assert.match(a.html,/disabled title="Creator-owned server entitlement/);
 assert.match(preview(a),/media-star-player.js/);
 assert.doesNotMatch(preview(a),/GEMINI_API_KEY|api_key|mint\(/i);
});
test('unsupported concepts are not mislabeled working software',()=>{
 const req=requestFromIssue(issue('News Phi AI', 'Make a real news card with fully working feeds'));
 const result=build(req);
 assert.equal(result.status,'needs_adapter');
 assert.throws(()=>preview(result),/No working card/);
});
