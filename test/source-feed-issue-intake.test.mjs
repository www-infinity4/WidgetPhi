import test from 'node:test';
import assert from 'node:assert/strict';
import {requestFromIssue,build,preview} from '../bots/card-build-engine.mjs';
import {parseIssueFeed} from '../bots/feed-issue-intake.mjs';

const fence=String.fromCharCode(96).repeat(3);
const item=(extra={})=>({title:'Synthetic research story',url:'https://example.org/research?utm_source=check',
  source:'Test journal',publishedAt:'2026-10-22T15:00:00Z',topics:['research'],
  summary:'Test fixture — not an actual news source.',...extra});
const issue=(value,{body='',block=true}={})=>({
  number:114,title:'[Card Build] Research updates',user:{login:'fixture-author'},
  body:['Title: Research updates',body,...(block?['Feed JSON:',fence+'json',JSON.stringify(value),fence]:[])].join('\n')
});
test('issue intake passes bounded structured feed to existing free card builder',()=>{
 const request=requestFromIssue(issue({items:[item()],topics:['research']}));
 assert.equal(request.feed.items.length,1);
 const card=build(request);
 assert.equal(card.status,'built');assert.equal(card.widget,'source-feed');assert.equal(card.paid,false);
 assert.match(preview(card),/Synthetic research story/);
 assert.match(preview(card),/no wallet charge/);
});
test('an issue with a publisher link does not fabricate a feed',()=>{
 const request=requestFromIssue(issue({}, {body:'Make headlines from https://example.org/',block:false}));
 assert.equal(build(request).status,'needs_source_data');
});
test('unclosed and invalid JSON fail closed instead of inventing content',()=>{
 const missing=parseIssueFeed(['Feed JSON:',fence+'json','{"items": [}'].join('\n'));
 assert.match(missing.error,/closing fence/i);
 const bad=requestFromIssue({...issue({items:[item()]}),
   body:['Title: Research updates','Feed JSON:',fence+'json','{"items": [}',fence].join('\n')});
 assert.match(build(bad).reason,/not valid JSON/);
});
test('rejects oversized, credentialed, empty and malformed feed inputs',()=>{
 assert.match(parseIssueFeed(['Feed JSON:',fence+'json','x'.repeat(14001),fence].join('\n')).error,/14,000/);
 assert.match(build(requestFromIssue(issue({items:[]}))).reason,/1–50/);
 assert.match(build(requestFromIssue(issue({items:[item({url:'https://user:pass@example.org/private'})]}))).reason,/without embedded credentials/);
 assert.match(build(requestFromIssue(issue({items:[item({source:''})]}))).reason,/requires a URL, title, source/);
});
test('deduplicates tracking variants and hides already seen URLs',()=>{
 const a=item(),b=item({url:'https://example.org/research?utm_campaign=other'});
 const req=requestFromIssue(issue({items:[a,b],topics:['research']}));
 assert.equal(build(req).status,'built');
 assert.match(build(requestFromIssue(issue({items:[a],seenUrls:['https://example.org/research']}))).reason,/No unread/);
});
test('source summaries remain escaped and original source links remain visible',()=>{
 const card=build(requestFromIssue(issue({items:[item({title:'<script>alert(1)</script>',summary:'<img src=x onerror=alert(1)>'})]})));
 assert.equal(card.status,'built');
 const html=preview(card);
 assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
 assert.match(html,/&#60;script&#62;|&#60;img/);
 assert.match(html,/https:\/\/example\.org\/research/);
});
test('author-submitted data does not imply settlement or publication',()=>{
 const card=build(requestFromIssue(issue({items:[item()]})));
 assert.equal(card.paid,false);
 assert.equal(card.status,'built');
 assert.equal(card.deploymentUrl,undefined);
 assert.equal(card.paymentReceipt,undefined);
});
