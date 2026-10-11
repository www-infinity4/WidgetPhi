/**
 * WidgetPhi robot dispatcher.
 *
 * issues.opened or workflow_dispatch => catalog template/setting proposal PR.
 * schedule => bounded scan of owner Phi repositories and queued source discoveries.
 * The bot never auto-merges, deploys, copies private data, or mints currency.
 *
 * GitHub Actions grants this runner contents/pulls/issues only in WidgetPhi.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {applyRequest,normalizeRequest,requestFromIssue,requestFromSource,
 sourcePathAllowed,SOURCE_REPOSITORIES} from './card-engine.mjs';

const API='https://api.github.com',REPO='www-infinity4/WidgetPhi';
const TOKEN=process.env.GITHUB_TOKEN||'';
const EVENT=process.env.GITHUB_EVENT_NAME||'workflow_dispatch';
const EVPATH=process.env.GITHUB_EVENT_PATH||'';
const AGENT='widgetphi-card-bot';
const jsonHeader={'accept':'application/vnd.github+json','user-agent':AGENT,
 'x-github-api-version':'2022-11-28'};

async function gh(endpoint,{method='GET',body}={}){
 const response=await fetch(API+endpoint,{method,headers:{...jsonHeader,
  ...(TOKEN?{authorization:'Bearer '+TOKEN}:{}),...(body?{'content-type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(19000)});
 if(response.status===404)return null;
 const value=await response.json().catch(()=>({}));
 if(!response.ok)throw Error('github_'+response.status+':'+String(value.message||'error').slice(0,120));
 return value;
}
function git(...args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function issueFields(body){
 const result={};
 const sections=String(body||'').split(/^###\s+/m).slice(1);
 for(const section of sections){
  const first=section.indexOf('\n');
  if(first<0)continue;
  const key=section.slice(0,first).trim().toLowerCase();
  const value=section.slice(first+1).trim();
  result[key]=value==='_No response_'?'':value;
 }
 return result;
}
function fromForm(issue){
 const match=String(issue.title||'').match(/^\[Card (New|Enhance)\]\s+(.+)$/i);
 if(!match)return null;
 const fields=issueFields(issue.body);
 const kind=match[1].toLowerCase()==='new'?'new':'enhance';
 const descr=fields['what should this card do?']||fields['change requested']||
  fields['what should change?']||fields['description']||'';
 const raw={kind,name:match[2],description:descr,
  cardId:kind==='enhance'?(fields['existing card id']||match[2]):undefined,
  category:fields['category'],issueNumber:issue.number,requestedBy:issue.user?.login};
 if(fields['setting key']&&fields['setting type']){
  const type=fields['setting type'];
  const value=fields['setting default value']||'';
  raw.setting={key:fields['setting key'],label:fields['setting label']||fields['setting key'],type,
   default:type==='boolean'?value.toLowerCase()==='true':type==='number'?Number(value):value};
  if(type==='select')raw.setting.options=(fields['setting choices']||'').split(',').map(x=>x.trim()).filter(Boolean);
 }
 return normalizeRequest(raw);
}
function loadRequest(issue){
 try{
  return requestFromIssue(issue)||fromForm(issue);
 }catch(error){
  if(!String(error.message).includes('missing bounded WidgetPhi request payload'))throw error;
  return fromForm(issue);
 }
}
async function openIssueComment(number,text){
 try{await gh('/repos/'+REPO+'/issues/'+number+'/comments',{method:'POST',body:{body:text.slice(0,2500)}})}
 catch(e){console.warn('issue_comment_failed',String(e.message));}
}
async function hasJob(id){
 const result=await gh('/repos/'+REPO+'/contents/catalog/jobs/'+id+'.json?ref=main');
 return Boolean(result);
}
async function hasExistingPR(id){
 const list=await gh('/repos/'+REPO+'/pulls?state=all&per_page=100');
 return (list||[]).find(x=>String(x.body||'').includes('<!-- widgetphi-job:'+id+' -->'))||null;
}
async function processRequest(raw,{issueNumber=null,ownerAuthorized=false}={}){
 const request=normalizeRequest(raw);
 const id=request.issueNumber?'issue-'+request.issueNumber:
  'source-'+request.source.sha.slice(0,12)+'-'+request.cardId;
 if(await hasJob(id)){console.log('job_already_on_main',id);return {id,existing:true};}
 const previous=await hasExistingPR(id);
 if(previous){console.log('pr_already_exists',previous.html_url);return {id,existing:true,pr:previous.html_url};}
 const catalog=JSON.parse(await readFile('catalog/cards.json','utf8'));
 const result=applyRequest(catalog,request);
 const branch='bot/widgetphi-'+id.replace(/[^a-z0-9-]/g,'-').slice(0,80);
 try{
  git('switch','-c',branch);
  await mkdir('catalog/jobs',{recursive:true});
  await writeFile('catalog/jobs/'+id+'.json',JSON.stringify({...result.job,
   outcome:result.reason,buildRequestEvidence:'Request was validated; template changes are not production code.'},null,2)+'\n');
  if(result.changed)await writeFile('catalog/cards.json',JSON.stringify(result.catalog,null,2)+'\n');
  // Run existing tests before opening any PR; exceptions leave the branch unpushed.
  execFileSync('npm',['test'],{stdio:'inherit'});
  git('add','catalog/cards.json','catalog/jobs/'+id+'.json');
  const staged=git('diff','--cached','--name-only');
  if(!staged)throw Error('No staged changes');
  git('-c','user.name=widgetphi-card-bot[bot]','-c',
   'user.email=41898282+github-actions[bot]@users.noreply.github.com',
   'commit','-m','WidgetPhi card build intake: '+id);
  // The verified repository owner may publish safe, tested metadata directly.
  // This NEVER completes an unfinished adapter or promotes wallet-related code.
  if(ownerAuthorized){
   git('push','origin','HEAD:refs/heads/main');
   const sha=git('rev-parse','HEAD');
   const commitUrl='https://github.com/'+REPO+'/commit/'+sha;
   if(issueNumber)await openIssueComment(issueNumber,'WidgetPhi bot checked in the card starter/job: '+commitUrl+
     '\nOutcome: '+result.reason+'. This is catalog metadata, not a finished integrated card.');
   console.log('owner_catalog_metadata_published',commitUrl,result.reason);
   return {id,commit:commitUrl,outcome:result.reason};
  }
  git('push','origin','HEAD:refs/heads/'+branch);
  const body='<!-- widgetphi-job:'+id+' -->\n'+
   '## WidgetPhi automatic card workshop handoff\n'+
   '**Request:** '+(issueNumber?'https://github.com/'+REPO+'/issues/'+issueNumber:'verified repository source')+'\n'+
   '**Outcome:** '+result.reason+'\n'+
   '**Build state:** A checked-in template/settings change and a queued engineering receipt, not completed live functionality.\n'+
   '**Bots:** Blue validates provenance and schema; Green implements requested behavior; Pink tests; Purple verifies before release.\n'+
   'Do not auto-merge unfinished functional work. Existing site data and wallet settlements are unchanged.';
  const pr=await gh('/repos/'+REPO+'/pulls',{method:'POST',body:{head:branch,base:'main',
   title:'WidgetPhi robot: '+request.kind+' '+request.name.slice(0,70),body,draft:true}});
  if(issueNumber)await openIssueComment(issueNumber,'WidgetPhi created a reviewable build branch: '+pr.html_url+
   '\nStatus: '+result.reason+'. Live functionality is not claimed until verified.');
  console.log('created_card_pr',pr.html_url,result.reason);
  return {id,pr:pr.html_url,outcome:result.reason};
 }finally{
  // Only the checkout in this Action workspace is affected.
  try{git('switch','main')}catch(e){console.warn('restore_default_branch_failed',String(e.message))}
 }
}
async function scanSources(){
 const known=(await gh('/repos/'+REPO+'/issues?state=all&per_page=100')||[])
  .filter(x=>!x.pull_request).map(x=>String(x.body||''));
 const results=[];
 // Bounded scan of recently committed pages/components in source repos.
 const scanRepos=SOURCE_REPOSITORIES.filter(x=>!/WidgetPhi|Builder-Reserve|DesiPhi/.test(x));
 for(const repo of scanRepos.slice(0,12)){
  if(results.length>=3)break;
  let commits;try{commits=await gh('/repos/'+repo+'/commits?per_page=2')}catch{continue}
  for(const commit of (commits||[]).slice(0,2)){
   if(Date.now()-Date.parse(commit.commit?.committer?.date||0)>72*3600000)continue;
   if(/automated|refresh feed|[sS]kip ci/i.test(commit.commit?.message||''))continue;
   let record;try{record=await gh('/repos/'+repo+'/commits/'+commit.sha)}catch{continue}
   const files=(record?.files||[]).filter(x=>x.status!=='removed'&&
    sourcePathAllowed(x.filename)&&x.additions>12);
   for(const item of files.slice(0,1)){
    if(results.length>=3)break;
    const source={repo,sha:commit.sha,path:item.filename};
    const req=requestFromSource(source);if(!req)continue;
    const marker='<!-- widgetphi-source:'+repo+':'+commit.sha+':'+item.filename+' -->';
    if(known.some(body=>body.includes(marker)))continue;
    const issue=await gh('/repos/'+REPO+'/issues',{method:'POST',body:{
     title:'[Card Discover] Reuse '+item.filename.slice(0,80)+' from '+repo.split('/')[1],
     body:[marker,'## Candidate for WidgetPhi card workshop',
      'Source: https://github.com/'+repo+'/blob/'+commit.sha+'/'+item.filename,
      'Potential behavior: '+req.description,
      'Route to Blue for validation, Green for reusable implementation, Pink for tests.',
      'Status: discovery only; no code copied, no deployment and no paid receipts.'].join('\n\n')}});
    known.push(marker);results.push(issue.html_url);
   }
  }
 }
 console.log('source_scan_issue_urls',JSON.stringify(results));
 return results;
}
async function processQueuedOwnerIssues(){
 const issues=await gh('/repos/'+REPO+'/issues?state=open&per_page=100')||[];
 let processed=0;
 for(const issue of issues){
  if(issue.pull_request||!(/^\[Card (New|Enhance)\]/i.test(issue.title||'')))continue;
  if(processed>=3)break;
  try{
   const raw=loadRequest(issue);if(!raw)continue;
   const result=await processRequest(raw,{issueNumber:issue.number,ownerAuthorized:issue.user?.login==='www-infinity4'});
   if(!result.existing)processed++;
  }catch(e){console.error('card_issue_blocked',issue.number,String(e.message));
   await openIssueComment(issue.number,'WidgetPhi cannot build this card yet: '+String(e.message).slice(0,200));}
 }
 return processed;
}
async function main(){
 if(process.env.GITHUB_REPOSITORY!==REPO||!TOKEN)throw Error('Scoped WidgetPhi GitHub token required');
 if(EVENT==='pull_request')return;
 if(EVENT==='schedule'){
  await scanSources();
  await processQueuedOwnerIssues();
  return;
 }
 if(EVENT==='issues'){
  const data=JSON.parse(await readFile(EVPATH,'utf8'));
  if(!['opened','edited','reopened'].includes(data.action)||!data.issue||data.repository?.full_name!==REPO)return;
  try{
   const raw=loadRequest(data.issue);
   if(raw)await processRequest(raw,{issueNumber:data.issue.number,ownerAuthorized:data.issue.user?.login==='www-infinity4'});
  }catch(e){await openIssueComment(data.issue.number,'WidgetPhi request blocked: '+String(e.message).slice(0,220));throw e}
  return;
 }
 if(EVENT==='repository_dispatch'){
  const event=JSON.parse(await readFile(EVPATH,'utf8'));
  if(event.action!=='widgetphi-card-request')return;
  // Authenticated dispatch remains review-only unless the verified owner submits an issue.
  // Never trust requestedBy or other browser-supplied identity claims.
  const raw=normalizeRequest(event.client_payload);
  await processRequest(raw,{issueNumber:raw.issueNumber});
  return;
 }
 if(EVENT==='workflow_dispatch'){
  const event=EVPATH?JSON.parse(await readFile(EVPATH,'utf8')):{};
  const inputs=event.inputs||{};
  if(inputs.card_issue_number){
   const n=Number(inputs.card_issue_number);
   if(!Number.isSafeInteger(n)||n<1)throw Error('Valid issue number required');
   const issue=await gh('/repos/'+REPO+'/issues/'+n);
   if(!issue)throw Error('Issue not found');
   const request=loadRequest(issue);if(!request)throw Error('This is not a WidgetPhi card request');
   return processRequest(request,{issueNumber:n,ownerAuthorized:issue.user?.login==='www-infinity4'});
  }
  await scanSources();await processQueuedOwnerIssues();
 }
}
main().catch(e=>{console.error('card_bot_failed',String(e.message));process.exitCode=1});
