import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const widgetPhi=require('../src/index.js');
const tidy=s=>String(s||'').trim().slice(0,2500);
export function requestFromIssue(issue){
 if(!/^\[Card Build\]\s+/i.test(issue?.title||''))return null;
 const body=tidy(issue.body),title=tidy(body.match(/^\s*Title\s*:\s*(.+)$/im)?.[1]||issue.title.replace(/^\[Card Build\]\s*/i,'')).slice(0,100);
 const raw=body.match(/^\s*Symbols?\s*:\s*(.+)$/im)?.[1]||'';
 const symbols=[...new Set(raw.split(/[,\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean))].slice(0,15);
 const urls=[...new Set((body.match(/https:\/\/[^\s<>"']+/g)||[]).map(x=>x.replace(/[),.;]+$/,'')))].slice(0,40);
 return {number:issue.number,title,body,symbols,urls,author:issue.user?.login||''};
}
export function build(request,preferred=''){
 if(!request)return{status:'not_a_card_job'};
 const text=request.title+' '+request.body;
 const match=/\b(shop phi|curated store|curated ads|advertisement card|storefront)\b/i.test(text)?'shop-phi':
 /\b(stock|stocks|ticker|equities|share price)\b/i.test(text)?'market-ticker':
 /\b(media star|audio gallery|curated media)\b/i.test(text)?'media-star':
 /\b(youtube|video feed|video gallery)\b/i.test(text)?'video-feed':
 /\b(podcast|recorded spaces)\b/i.test(text)?'podcast-card':null;
 const widget=widgetPhi.list().includes(preferred)?preferred:match;
 if(!widget)return{status:'needs_adapter',reason:'No implemented card matches this request'};
 const spec={title:request.title};
 if(widget==='market-ticker'||widget==='stock-card'){
  if(!request.symbols.length||request.symbols.some(s=>!/^(?:[A-Z0-9._-]{2,20}:)?[A-Z0-9.^-]{1,16}$/.test(s)))
   return{status:'needs_source_data',reason:'Add explicit Symbols: NASDAQ:AAPL,NASDAQ:MSFT; the bot must not guess stocks'};
  if(widget==='market-ticker')spec.symbols=request.symbols;
  else{const p=request.symbols[0].split(':');spec.symbol=p.pop();spec.exchange=p[0]||'';spec.company=request.title}
 }else if(widget==='shop-phi'){
  const lines=request.body.split(/\r?\n/).map(x=>x.trim());
  const items=[];
  for(const line of lines){
   const m=line.match(/^(Item|Ad):\s*(.+?)\s*\|\s*(https:\/\/[^\s|]+)(?:\s*\|\s*(.+))?$/i);
   if(!m)continue;
   if(m[1].toLowerCase()==='ad'&&!m[4])return{status:'needs_source_data',reason:'Sponsored Ad lines must specify sponsor after a second |'};
   items.push({title:m[2],url:m[3],kind:m[1].toLowerCase()==='ad'?'advertisement':'product',sponsored:m[1].toLowerCase()==='ad',sponsor:m[4]||''});
  }
  if(!items.length)return{status:'needs_source_data',reason:'Add Item: Product title | https://merchant.example/item or Ad: Title | https://source | Sponsor'};
  spec.items=items;spec.priceStarCoins=1;
  spec.creatorBrand=request.body.match(/^Curator:\s*(.+)$/im)?.[1]||'My Picks';
 }else if(widget==='media-star'){
  if(!request.urls.length)return{status:'needs_source_data',reason:'Add original media URLs before generating the player'};
  spec.query=request.title;spec.priceStarCoins=0;spec.sources=request.urls.map((url,i)=>({url,title:'Sourced item '+(i+1)}));
 }else if(widget==='video-feed'){
  if(!request.urls.length)return{status:'needs_source_data',reason:'Add official video URLs'};
  spec.videos=request.urls.map((url,i)=>({url,title:'Video '+(i+1)}));
 }else if(widget==='podcast-card'){
  if(!request.urls.length)return{status:'needs_source_data',reason:'Add original recorded episode URLs'};
  spec.episodes=request.urls.map((sourceUrl,i)=>({sourceUrl,title:'Episode '+(i+1)}));spec.priceStarCoins=0;
 }
 let html;try{html=widgetPhi.handle({type:'build_widget',widget,spec}).html}
 catch(e){return{status:'needs_source_data',reason:String(e.message).slice(0,240)}}
 if(widget==='video-feed'&&html.includes('No verified video sources are attached'))return{status:'needs_source_data',reason:'No compatible official video URLs'};
 if(widget==='media-star'&&/source index · 0 items/i.test(html))return{status:'needs_source_data',reason:'No supported original media URLs'};
 const assets=widget==='market-ticker'||widget==='stock-card'?['../../browser/widgetphi-stock.js']:
 widget==='video-feed'?['../../browser/widgetphi-video.js']:widget==='media-star'?['../media-star-player.js']:[];
 return {status:'built',widget,spec,html,assets,paid:false};
}
export function preview(card){
 if(card.status!=='built')throw Error('No working card exists for this task');
 const script=card.assets.map(s=>'<script defer src="'+s+'"></script>').join('');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WidgetPhi card</title><style>body{font:16px/1.5 system-ui;margin:20px;background:#f7f3ff;color:#271d39}main{max-width:900px;margin:auto}a{overflow-wrap:anywhere}</style></head><body><main>'+card.html+'<p>Working card preview · no wallet charge</p></main>'+script+'</body></html>';
}
