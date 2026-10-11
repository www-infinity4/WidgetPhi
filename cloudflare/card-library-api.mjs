import {suggest,nextSequence} from '../src/card-library-discovery.mjs';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'public, max-age=60'}});
const clean=(x,n=100)=>String(x??'').trim().slice(0,n);
function entry(row){
 return {id:row.template_id,name:row.display_name,category:row.category,description:row.description,
 sourceRepo:row.source_repo,sourcePath:row.source_path,readiness:row.readiness,
 settings:JSON.parse(row.settings_json||'[]'),keywords:JSON.parse(row.keywords_json||'[]'),active:row.active};
}
export async function listLibrary(db,{query='',limit=12,history=[],installed=[]}={}){
 const rows=await db.prepare('SELECT template_id,display_name,category,description,source_repo,source_path,readiness,settings_json,keywords_json,active FROM phi_card_templates WHERE active=1 ORDER BY display_name ASC LIMIT 5000').all();
 const items=(rows.results||[]).map(entry);
 const matched=clean(query,140)?suggest(items,clean(query,140),{limit,history,installed}):
   items.slice(0,Math.min(limit,100)).map(x=>({...x,templateId:x.id,score:0}));
 return {schema:'phi.card-library/v1',matched:matched.map(x=>({
  id:x.templateId||x.id,name:x.name,category:x.category,readiness:x.readiness,
  sourceRepo:x.sourceRepo,settings:x.settings,score:x.score,
  implementation:x.readiness==='existing'?'widgetphi_widget':'adapter_required'
 })),next:nextSequence(items,history),totalIndexed:items.length,
 readOnly:true,walletRequiredForCustomization:true};
}
export async function getLibraryCard(db,id){
 if(!/^[a-z][a-z0-9-]{1,79}$/.test(id))return reply({error:'invalid_card'},400);
 const row=await db.prepare('SELECT template_id,display_name,description,category,source_repo,source_path,readiness,settings_json,keywords_json,active FROM phi_card_templates WHERE template_id=? AND active=1').bind(id).first();
 if(!row)return reply({error:'not_found'},404);
 const c=entry(row);return reply({id:c.id,name:c.name,description:c.description,category:c.category,readiness:c.readiness,sourceRepo:c.sourceRepo,sourcePath:c.sourcePath,settings:c.settings,keywords:c.keywords,requiresDeveloperAdapter:c.readiness!=='existing'});
}
export async function bindLineage(db,{siteId,instanceId,templateId,ownerSub,priorCard=null}){
 const row=await db.prepare('SELECT template_id FROM phi_card_templates WHERE template_id=? AND active=1').bind(templateId).first();
 if(!row)throw Object.assign(Error('card_not_in_verified_catalog'),{status:400});
 const existing=await db.prepare('SELECT template_id,original_template_id FROM phi_card_lineage WHERE site_id=? AND instance_id=?').bind(siteId,instanceId).first();
 if(existing&&existing.template_id!==templateId)throw Object.assign(Error('use_new_instance_for_different_card'),{status:409});
 // Caller must first prove site ownership with the signed wallet sub.
 if(typeof ownerSub!=='string'||ownerSub.length<8)throw Object.assign(Error('verified_creator_required'),{status:401});
 const site=await db.prepare('SELECT site_id FROM sites WHERE site_id=? AND owner_sub=?').bind(siteId,ownerSub).first();
 if(!site)throw Object.assign(Error('site_not_owned'),{status:403});
 await db.prepare('INSERT OR IGNORE INTO phi_card_lineage(site_id,instance_id,template_id,original_template_id,derivative_parent_site_id,derivative_parent_instance_id,direct_creator_sub,created_at) VALUES(?,?,?,?,?,?,?,?)')
 .bind(siteId,instanceId,templateId,templateId,priorCard?.siteId||null,priorCard?.instanceId||null,ownerSub,Date.now()).run();
 return {ok:true,siteId,instanceId,templateId,originalTemplateId:templateId,
  ownerWalletAuthenticated:true,royalties:'not_settled'};
}
