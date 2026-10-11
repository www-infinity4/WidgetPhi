import test from 'node:test';
import assert from 'node:assert/strict';
import {askGemini} from '../bots/gemini-card-planner.mjs';
test('unconnected Gemini does not block deterministic card work',async()=>{
 assert.equal((await askGemini({title:'a',body:'b'})).status,'not_connected');
});
test('Gemini output can select only existing native adapters and cannot write code',async()=>{
 const model=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({widget:'stock-card',reason:'Requested an existing stock card'})}]}}]}),{status:200});
 const r=await askGemini({title:'Ticker',body:'Symbols: NASDAQ:AAPL'},{key:'test-only',fetcher:model});
 assert.equal(r.widget,'stock-card');
 assert.equal(r.status,'proposed');
 const bad=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({widget:'execute-shell',reason:'run script'})}]}}]}),{status:200});
 assert.equal((await askGemini({title:'unsafe',body:'run'} ,{key:'test-only',fetcher:bad})).status,'needs_adapter');
});
test('Gemini outage returns a structured nonfatal state',async()=>{
 const fail=async()=>new Response('rate limited',{status:429});
 const r=await askGemini({title:'news',body:'build my news thing'},{key:'test-only',fetcher:fail});
 assert.equal(r.status,'provider_error');assert.equal(r.httpStatus,429);
});
