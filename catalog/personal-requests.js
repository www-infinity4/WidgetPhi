/* A small, deterministic QuantaData intent bridge for a DEVICE-LOCAL workspace.
 * No model-authored code, remote job dispatch, wallet mutation, or assumed tickers.
 * Browser + Node compatible for contract tests. */
(function(root){
'use strict';
const intentRules=[
 {id:'market-ticker',re:/\b(ticker tape|market ticker|stock ticker|stocks ticker|multiple stocks|watchlist|stock watch)\b/i},
 {id:'stock-card',re:/\b(stock|stocks|share price|equity|equities|stock player|stock chart|stock card)\b/i},
 {id:'research-viewer',re:/\b(research viewer|browse sources|source viewer|page viewer)\b/i},
 {id:'search-engine',re:/\b(search engine|web search|research search|search bar)\b/i},
 {id:'story-writer',re:/\b(story writer|write stories|make a story|story creation)\b/i},
 {id:'infinite-stories',re:/\b(reads and realms|reads & realms|infinite stories|infinite reader)\b/i},
 {id:'infinity-radio',re:/\b(infinity radio|radio station|my radio)\b/i},
 {id:'media-star',re:/\b(media star|music player|audio gallery|media player)\b/i},
 {id:'video-feed',re:/\b(video feed|youtube videos|video gallery)\b/i},
 {id:'podcast-card',re:/\b(podcast|recorded spaces|twitter spaces|x spaces)\b/i},
 {id:'scholastic-reader',re:/\b(scholastic reader|learning reader|educational reader)\b/i}
];
const tickerPattern=/^(?:(?:[A-Z0-9._-]{2,20}):)?[A-Z0-9.^-]{1,16}$/;
function symbolsFrom(text){
 const matches=[];
 const named=String(text).match(/\b(?:ticker|symbol|stocks?|for)\s*[:=]?\s*((?:(?:[A-Z0-9._-]{2,20}:)?[A-Z][A-Z0-9.^-]{0,15})(?:\s*[,/&]\s*(?:(?:[A-Z0-9._-]{2,20}:)?[A-Z][A-Z0-9.^-]{0,15}))*)\b/);
 if(named)matches.push(...named[1].split(/\s*[,/&]\s*/));
 for(const m of String(text).matchAll(/\$([A-Z][A-Z0-9.^-]{0,15})\b|\b([A-Z0-9._-]{2,20}:[A-Z][A-Z0-9.^-]{0,15})\b/g))matches.push(m[1]||m[2]);
 return [...new Set(matches.map(x=>x.trim().toUpperCase()).filter(x=>tickerPattern.test(x)&&!['STOCK','STOCKS','CARD','PLAYER','TICKER','FOR'].includes(x)))].slice(0,12);
}
const words=s=>String(s||'').toLowerCase().match(/[a-z0-9]{3,}/g)||[];
function semanticTerms(text){
 const stop=new Set(['add','make','create','need','want','please','my','the','card','page','quantaphi','with','for','that','have','show','put','some','this','into','from','and','bot','robot','player']);
 return [...new Set(words(text).filter(x=>!stop.has(x)))].slice(0,20);
}
function plan(text,definitions){
 const prompt=String(text||'').trim();if(!prompt||prompt.length>800)return{status:'invalid',reason:'Describe the card in 1–800 characters.'};
 const rule=intentRules.find(x=>x.re.test(prompt));
 if(!rule)return{status:'needs-adapter',reason:'No existing card matches safely. Blue can draft a request for Purple/Green review; no code or job has been launched.',terms:semanticTerms(prompt)};
 const def=(definitions||[]).find(x=>x.id===rule.id);
 if(!def)return{status:'needs-adapter',reason:'The matched WidgetPhi card is not registered.',terms:semanticTerms(prompt)};
 const settings=Object.fromEntries(def.settings.map(f=>[f.key,f.default]));
 const symbols=(rule.id==='stock-card'||rule.id==='market-ticker')?symbolsFrom(prompt):[];
 if(symbols.length)settings.index=symbols.join(',');
 const required=(rule.id==='stock-card'||rule.id==='market-ticker')&&!symbols.length;
 return{status:required?'needs-input':'configured',cardId:rule.id,cardName:def.name,
  readiness:def.readiness,settings,symbols,terms:semanticTerms(prompt),
  reason:required?'Enter an exchange/ticker such as NASDAQ:AAPL to activate live market display. No company was guessed.':
  def.readiness!=='existing'?'Card settings prepared. A working adapter still requires authorized integration.':
  'Existing WidgetPhi adapter selected; preview depends on the provider.',prompt};
}
const api={plan,symbolsFrom,semanticTerms};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.WidgetPhiPersonalRequests=api;
})(typeof window!=='undefined'?window:null);
