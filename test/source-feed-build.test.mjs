import test from 'node:test';
import assert from 'node:assert/strict';
import {build, preview} from '../bots/card-build-engine.mjs';
import {askGemini} from '../bots/gemini-card-planner.mjs';

const item={title:'Verified research story',url:'https://example.org/research',source:'Synthetic test journal',publishedAt:'2026-01-01',topics:['research'],summary:'Test fixture, not real research.'};
const request={title:'Research feed',body:'Build a compact journal feed',urls:[],symbols:[],feed:{items:[item],topics:['research']}};
test('build engine creates an attributed free source card through the existing API',()=>{
 const card=build(request);
 assert.equal(card.status,'built');assert.equal(card.widget,'source-feed');assert.equal(card.paid,false);
 assert.match(preview(card),/Verified research story/);
 assert.match(preview(card),/no wallet charge/);
});
test('a source URL or planner choice alone cannot claim a built feed',()=>{
 assert.equal(build({...request,feed:undefined,urls:['https://example.org']},'source-feed').status,'needs_source_data');
 assert.equal(build({...request,feed:{items:[{...item,source:''}]}},'source-feed').status,'needs_source_data');
 assert.equal(build({...request,feed:{items:[item],seenUrls:[item.url]}},'source-feed').status,'needs_source_data');
});
test('Gemini can select source-feed and build still requires actual source data',async()=>{
 const fetcher=async(url, options)=>{
  assert.match(JSON.parse(options.body).contents[0].parts[0].text,/source-feed/);
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({widget:'source-feed',reason:'Requested sourced headlines'})}]}}]}));
 };
 const plan=await askGemini({title:'Iran coverage',body:'Make a news card'},{key:'synthetic-test',fetcher});
 assert.equal(plan.status,'proposed');assert.equal(plan.widget,'source-feed');
 assert.equal(build({...request,feed:undefined},plan.widget).status,'needs_source_data');
 assert.equal(build(request,plan.widget).status,'built');
});
