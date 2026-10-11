/** Public, read-only WidgetPhi recommendation service from managed Cloudflare D1.
 * No StarQuest balances, private sites, owner IDs, media purchases or writes. */
const HEADERS={
 'content-type':'application/json; charset=utf-8',
 'access-control-allow-origin':'*',
 'access-control-allow-methods':'GET,HEAD,OPTIONS',
 'cache-control':'public, max-age=60',
 'x-content-type-options':'nosniff'
};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const terms=v=>String(v||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1);
const decode=x=>{try{return JSON.parse(x||'[]')}catch{return []}};
export function ranked(row,query){
 const q=String(query||'').toLowerCase().trim(),words=terms(q),name=row.display_name.toLowerCase(),id=row.template_id;
 const tags=decode(row.keywords_json);
 const corpus=[name,id,row.description||'',...tags].join(' ').toLowerCase();
 let score=q===name||q===id?100:0;
 for(const tag of tags)if(String(tag).toLowerCase()===q)score+=85;
 for(const word of words)if(corpus.includes(word))score+=11;
 if(words.length&&words.every(x=>corpus.includes(x)))score+=18;
 if(row.readiness==='existing')score+=25;
 if(row.readiness==='candidate')score-=40;
 return score;
}
const safe=row=>({
 id:row.template_id,name:row.display_name,category:row.category,
 description:row.description,sourceRepo:row.source_repo,sourcePath:row.source_path,
 readiness:row.readiness,readyToEmbed:row.readiness==='existing',
 settings:decode(row.settings_json)
});
async function all(db){
 const result=await db.prepare("SELECT template_id,display_name,category,description,source_repo,source_path,readiness,settings_json,keywords_json FROM phi_card_templates WHERE active=1 ORDER BY display_name LIMIT 2000").all();
 return result.results||[];
}
export default {
 async fetch(request,env){
  try{
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:HEADERS});
   if(request.method!=='GET'&&request.method!=='HEAD')return respond({error:'read_only'},405);
   const u=new URL(request.url);
   if(u.pathname==='/health')return respond({ok:!!env.CATALOG_DB,service:'widgetphi-card-library',databaseBound:!!env.CATALOG_DB},env.CATALOG_DB?200:503);
   if(!env.CATALOG_DB)return respond({error:'database_unavailable'},503);
   const match=u.pathname.match(/^\/v1\/cards\/([a-z][a-z0-9-]{1,79})$/);
   if(match){
    const r=await env.CATALOG_DB.prepare("SELECT template_id,display_name,category,description,source_repo,source_path,readiness,settings_json,keywords_json FROM phi_card_templates WHERE active=1 AND template_id=?").bind(match[1]).first();
    return r?respond({card:safe(r)}):respond({error:'card_not_found'},404);
   }
   if(u.pathname==='/v1/cards'){
    const q=String(u.searchParams.get('q')||'').trim().slice(0,140);
    const limit=Math.min(30,Math.max(1,Number(u.searchParams.get('limit'))||12));
    const rows=await all(env.CATALOG_DB);
    const results=rows.map(r=>({...safe(r),score:ranked(r,q)}))
      .filter(r=>!q||r.score>5)
      .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name))
      .slice(0,limit);
    return respond({schema:'phi.card-library/public-v1',query:q,totalIndexed:rows.length,
     cards:results,canInstallExisting:results.some(x=>x.readyToEmbed),
     note:'Read-only capabilities. Custom sites require an authenticated Unified Wallet session. No rewards are issued by searching.'});
   }
   return respond({error:'not_found'},404);
  }catch{return respond({error:'catalog_lookup_failed'},502)}
 }
};
