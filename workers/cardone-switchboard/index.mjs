// Twilio-compatible opt-in switchboard for an OWNER-CONTROLLED number only.
// This file cannot modify or intercept any number or website owned by Cardone Capital.
const xml = x => String(x || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const say = x => '<Say voice="alice">'+xml(x)+'</Say>';
const response = body => new Response('<?xml version="1.0" encoding="UTF-8"?><Response>'+body+'</Response>',{
  headers:{'content-type':'text/xml; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
});
const stop = message => response(say(message)+'<Hangup/>');
function cleanTransfer(value){
  return /^\+[1-9]\d{6,14}$/.test(value||'') ? value : '';
}
function cleanStream(value){
  try{const u=new URL(value);return u.protocol==='wss:'&&!u.username&&!u.password&&!u.hash ? u.href : '';}catch{return '';}
}
function gather(text,action){
  return '<Gather input="dtmf" numDigits="1" method="POST" action="'+xml(action)+'" timeout="7">'+say(text)+'</Gather>'+say('No response received. Goodbye.')+'<Hangup/>';
}
function constantEqual(a,b){
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff |= a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function signatureIsValid(request,env,form){
  if(!env.TWILIO_AUTH_TOKEN||!env.PUBLIC_VOICE_BASE_URL)return false;
  let base;
  try{
    const u=new URL(env.PUBLIC_VOICE_BASE_URL);
    if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search)return false;
    base=u.origin;
  }catch{return false;}
  const got=request.headers.get('X-Twilio-Signature')||'';
  const u=new URL(request.url);
  // Twilio signs public URL + sorted form fields. Configure exact public origin, no X-Forwarded trust.
  const pairs=[...form.entries()].sort(([a],[b])=>a.localeCompare(b,'en'));
  const message=base+u.pathname+u.search+pairs.map(([k,v])=>k+v).join('');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.TWILIO_AUTH_TOKEN),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)));
  const expected=btoa(String.fromCharCode(...bytes));
  return constantEqual(got,expected);
}
function human(env){
  const to=cleanTransfer(env.HUMAN_TRANSFER_NUMBER);
  if(!to)return stop('Human transfer is not connected. Contact the official business through its published contact page.');
  return response(say('Connecting you to the authorized human team.')+'<Dial answerOnBridge="true" timeout="25"><Number>'+xml(to)+'</Number></Dial>'+say('The team was unavailable. Goodbye.')+'<Hangup/>');
}
export default {
  async fetch(request,env){
    const u=new URL(request.url);
    if(u.pathname==='/health'&&request.method==='GET')return Response.json({ok:true,service:'bubbles-call-switchboard',inboundLive:false});
    if(request.method!=='POST'||!['/voice','/voice/intent','/voice/consent','/voice/human'].includes(u.pathname))
      return new Response('Not found',{status:404});
    if(!/application\/x-www-form-urlencoded/i.test(request.headers.get('content-type')||''))
      return new Response('Unsupported media type',{status:415});
    if(Number(request.headers.get('content-length')||0)>8192)return new Response('Too large',{status:413});
    const body=await request.text();
    if(body.length>8192)return new Response('Too large',{status:413});
    const form=new URLSearchParams(body);
    if(!(await signatureIsValid(request,env,form)))return new Response('Forbidden',{status:403});
    const digit=form.get('Digits');
    if(u.pathname==='/voice'){
      return response(gather('Hello. This independent Bubbles switchboard demo is not Cardone Capital. Press 1 for the AI-assisted real estate information line. Press 2 to request an authorized human representative. No investment or payment information is collected.','/voice/intent'));
    }
    if(u.pathname==='/voice/intent'){
      if(digit==='1')return response(gather('Before proceeding, do you agree to speak with an automated AI assistant? Press 1 to agree. Press 2 for a human. Do not provide payment information or identity documents.','/voice/consent'));
      if(digit==='2')return human(env);
      return stop('Invalid choice. Goodbye.');
    }
    if(u.pathname==='/voice/consent'){
      if(digit==='2')return human(env);
      if(digit!=='1')return stop('AI consent was not given. Goodbye.');
      const stream=cleanStream(env.BUBBLES_VOICE_STREAM_URL);
      if(!stream)return stop('The AI voice service is not connected. No call transfer was attempted.');
      return response(say('You are now connecting to the automated AI assistant. You can hang up at any time.')+'<Connect><Stream url="'+xml(stream)+'"/></Connect>'+say('The AI assistant disconnected. Goodbye.')+'<Hangup/>');
    }
    return human(env);
  }
};
