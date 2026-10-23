import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,webcrypto} from 'node:crypto';
import worker from '../workers/cardone-switchboard/index.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const env={TWILIO_AUTH_TOKEN:'test-only-key',PUBLIC_VOICE_BASE_URL:'https://calls.example.test/'};
async function post(path,fields={},overrides={}){
  const body=new URLSearchParams(fields),url='https://calls.example.test'+path;
  const sig=createHmac('sha1',env.TWILIO_AUTH_TOKEN).update(url+[...body].sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+v).join('')).digest('base64');
  const req=new Request(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','X-Twilio-Signature':sig},body});
  return worker.fetch(req,{...env,...overrides});
}
test('Cardone quick card renders independently with source-linked safe content',()=>{
  const w=require('../src/widgets/cardone-capital');
  const html=w.build({title:'<img onerror=alert(1)>',agentEndpoint:'https://evil.test/leak'});
  assert.match(html,/&#60;img/);
  assert.doesNotMatch(html,/https:\/\/evil\.test/);
  assert.match(html,/cardonecapital.com\/disclosures/);
  assert.match(html,/not endorsed by or installed/);
});
test('rejects forged Twilio webhook and avoids public destination forwarding',async()=>{
  const req=new Request('https://calls.example.test/voice',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','X-Twilio-Signature':'fake'},body:'Digits=2'});
  assert.equal((await worker.fetch(req,env)).status,403);
  let res=await post('/voice/intent',{Digits:'2'});let txt=await res.text();
  assert.doesNotMatch(txt,/<Dial/);assert.match(txt,/not connected/);
});
test('inbound choice requires consent before AI stream',async()=>{
  assert.match(await (await post('/voice')).text(),/Press 1/);
  assert.match(await (await post('/voice/intent',{Digits:'1'})).text(),/do you agree/);
  assert.doesNotMatch(await (await post('/voice/consent',{Digits:'3'},{BUBBLES_VOICE_STREAM_URL:'wss://media.example/ai'})).text(),/<Connect>/);
  assert.doesNotMatch(await (await post('/voice/consent',{Digits:'1'})).text(),/<Connect>/);
});
test('approved stream and approved human number work only through configured server env',async()=>{
  assert.match(await (await post('/voice/consent',{Digits:'1'},{BUBBLES_VOICE_STREAM_URL:'wss://media.example.test/stream'})).text(),/<Connect><Stream url="wss:\/\/media\.example\.test\/stream"/);
  const txt=await (await post('/voice/intent',{Digits:'2'},{HUMAN_TRANSFER_NUMBER:'+13055550123'})).text();
  assert.match(txt,/<Dial/);assert.match(txt,/\+13055550123/);
  assert.doesNotMatch(await (await post('/voice/intent',{Digits:'2'},{HUMAN_TRANSFER_NUMBER:'javascript:alert(1)'})).text(),/<Dial/);
});
