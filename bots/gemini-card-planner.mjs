/** Optional model planner: Gemini may suggest an existing WidgetPhi adapter.
 * It cannot write code, supply fabricated content or authorize payments. */
const CHOICES=new Set(['stock-card','market-ticker','media-star','video-feed','podcast-card','shop-phi','infinity-concept','source-feed']);
export async function askGemini(request,{key='',fetcher=fetch}={}){
 if(!key)return {status:'not_connected'};
 const prompt='Choose a WidgetPhi component for this request. Allowed components: stock-card, market-ticker, media-star, video-feed, podcast-card, shop-phi, infinity-concept, source-feed. source-feed renders attributed news, research stories and team recaps; it does not fetch or invent content. Return only JSON {"widget":"component name or empty","reason":"short explanation"}. If this requires new software, return empty. Do not invent stock symbols or recording URLs. User request: '+String(request.title+' '+request.body).slice(0,1900);
 const body={contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0,maxOutputTokens:170}};
 try{
  const result=await fetcher('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
   method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},
   body:JSON.stringify(body),signal:AbortSignal.timeout(16000)});
  if(!result.ok)return{status:'provider_error',httpStatus:result.status};
  const raw=(await result.json()).candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
  const parsed=JSON.parse(raw);const choice=String(parsed.widget||'');
  if(!CHOICES.has(choice))return{status:'needs_adapter'};
  return {status:'proposed',widget:choice,reason:String(parsed.reason||'').slice(0,180)};
 }catch{return{status:'unavailable'}}
}
