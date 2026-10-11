import test from 'node:test';
import assert from 'node:assert/strict';
import {run,plan,probe,markdown} from '../bots/media-star-live-watch.mjs';

test('healthy services make no repair jobs; pending Fred payout is investigation only',async()=>{
 const mock=async url=>{
  if(url.includes('quantaphi.org'))return new Response('<div id="followingSpacesRadio"></div>',{status:200});
  const service=url.includes('starquest-ledger')?'starquest-ledger':url.includes('fred-spaces-ledger')?'fred-spaces-ledger':'media-star-following-spaces';
  return new Response(JSON.stringify({ok:true,service,paymentsReady:service==='fred-spaces-ledger'?false:undefined}),{status:200});
 };
 const r=await run(mock);
 assert.equal(r.services.length,4);
 assert.ok(r.services.every(x=>x.status==='ok'));
 assert.equal(r.openJobs.length,1);
 assert.equal(r.openJobs[0].priority,'investigate');
 assert.equal(r.autoWalletWrites,0);
 assert.equal(r.autoDeployments,0);
});
test('missing site card and bad API identity produce actionable bot receipts',async()=>{
 const r=plan([
  {id:'quanta-phi-site',url:'https://quantaphi.org/',status:'fail',httpStatus:200,error:'missing_media_star_mount'},
  {id:'starquest-ledger',url:'https://example.org/health',status:'fail',httpStatus:502,error:'http_502'}
 ],'2026-10-11T20:00:00Z');
 assert.equal(r.openJobs.length,2);
 assert.match(markdown(r),/Compare public endpoint/);
 assert.ok(r.openJobs.every(x=>x.skill==='phi-media-repair-watch'));
});
test('unreachable website remains unknown, not a fabricated outage',async()=>{
 const item=await probe({id:'quanta-phi-site',url:'https://quantaphi.org/',kind:'html',expect:'followingSpacesRadio'},async()=>{throw Error('DNS unavailable')});
 assert.equal(item.status,'unknown');
 const r=plan([item]);assert.equal(r.openJobs.length,0);
});
test('wrong identity, missing Worker and no public markup are failures',async()=>{
 const id=await probe({id:'starquest-ledger',url:'https://example.com',kind:'json',expect:'starquest-ledger'},async()=>new Response(JSON.stringify({ok:true,service:'fake-wallet'}),{status:200}));
 assert.equal(id.status,'fail');assert.equal(id.error,'service_identity_mismatch');
 const unavailable=await probe({id:'starquest-ledger',url:'https://example.com',kind:'json',expect:'starquest-ledger'},async()=>new Response('oops',{status:503}));
 assert.equal(unavailable.status,'fail');
});
