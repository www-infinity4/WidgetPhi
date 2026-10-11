/* Read-only online observer for Phi Media Star and StarQuest public health.
 * Never authenticates as a user or changes wallets, private catalogs or Workers.
 * Produces issue-ready skill work tickets from observable evidence. */
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const targets=Object.freeze([
 {id:'starquest-ledger',url:'https://starquest-ledger.marvaseater.workers.dev/health',kind:'json',expect:'starquest-ledger'},
 {id:'fred-spaces-ledger',url:'https://fred-spaces-ledger.marvaseater.workers.dev/health',kind:'json',expect:'fred-spaces-ledger'},
 {id:'media-star-following',url:'https://media-star-following-spaces.marvaseater.workers.dev/health',kind:'json',expect:'media-star-following-spaces'},
 {id:'quanta-phi-site',url:'https://quantaphi.org/',kind:'html',expect:'followingSpacesRadio'}
]);
function clean(x,n=140){return String(x??'').replace(/\s+/g,' ').slice(0,n)}
export function plan(checks,when=new Date().toISOString()){
 const jobs=[];
 for(const c of checks){
  if(c.status==='fail'){
   jobs.push({id:c.id,priority:'repair',skill:'phi-media-repair-watch',
    evidence:{url:c.url,httpStatus:c.httpStatus??null,error:clean(c.error||'unexpected_status')},
    next:'Compare public endpoint, current GitHub source and deployed Cloudflare Worker. Create minimal PR, verify staged browser/media tests, then deploy only with approved bindings and rollback.'});
  }else if(c.id==='fred-spaces-ledger'&&c.paymentsReady===false){
   jobs.push({id:'fred-payout-check',priority:'investigate',skill:'starquest-creator-settlement',
    evidence:{url:c.url,paymentsReady:false},
    next:'Checkout must remain disabled. Verify platform payout configuration against authoritative StarQuest records; follow TV-Database issue #110. Do not issue refunds or mint coins without reconciliation.'});
  }
 }
 return {schema:'phi.media-repair-watch/v1',at:when,services:checks,openJobs:jobs,autoWalletWrites:0,autoDeployments:0};
}
export async function probe(spec,fetcher=fetch){
 const started=Date.now(),out={id:spec.id,url:spec.url,status:'unknown',httpStatus:null};
 try{
  const response=await fetcher(spec.url,{cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(8500)});
  out.httpStatus=response.status;
  if(!response.ok){out.status='fail';out.error='http_'+response.status;return out}
  if(spec.kind==='json'){
   const json=await response.json();
   if(json?.ok!==true||json.service!==spec.expect){out.status='fail';out.error='service_identity_mismatch';return out}
   out.status='ok';
   if(spec.id==='fred-spaces-ledger')out.paymentsReady=json.paymentsReady===true;
  }else{
   const html=(await response.text()).slice(0,250000);
   if(!html.includes(spec.expect)){out.status='fail';out.error='missing_media_star_mount';return out}
   out.status='ok';
  }
 }catch(error){
  // DNS/egress failure is unknown, not proof a production service is down.
  out.status='unknown';out.error=clean(error?.message||error);
 }
 out.durationMs=Date.now()-started;
 return out;
}
export async function run(fetcher=fetch){
 const checks=await Promise.all(targets.map(t=>probe(t,fetcher)));
 return plan(checks);
}
export function markdown(report){
 const lines=['# Media Star repair watch','', 'Read-only source checks · '+report.at,''];
 for(const c of report.services)lines.push('- **'+c.id+'**: '+c.status+' · HTTP '+(c.httpStatus??'?')+(c.error?' · '+c.error:''));
 lines.push('', '## Repair jobs');
 if(!report.openJobs.length)lines.push('No actionable service failures found. Unknown connectivity is not treated as a confirmed outage.');
 for(const job of report.openJobs)lines.push('- **'+job.priority+': '+job.id+'** · skill: '+job.skill+' — '+job.next);
 lines.push('','No wallet writes, paid claims or deployments were performed.');
 return lines.join('\n')+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await run();
 const dir=process.env.MEDIA_WATCH_OUTPUT||'media-watch-output';
 await mkdir(dir,{recursive:true});
 await Promise.all([
  writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n'),
  writeFile(dir+'/report.md',markdown(report)),
 ]);
 console.log(JSON.stringify({services:report.services.map(x=>({id:x.id,status:x.status})),jobs:report.openJobs.length}));
}
