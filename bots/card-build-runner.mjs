/** Working GitHub bot: verified owner card issue -> native widget -> tests -> PR.
 * Does not execute LLM-supplied scripts or deploy private user resources. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {requestFromIssue,build,preview} from './card-build-engine.mjs';
import {askGemini} from './gemini-card-planner.mjs';
const REPO='www-infinity4/WidgetPhi';
const API='https://api.github.com/repos/'+REPO;
const token=process.env.GITHUB_TOKEN||'';
const name=process.env.GITHUB_EVENT_NAME||'workflow_dispatch';
const headers={'accept':'application/vnd.github+json','content-type':'application/json','user-agent':'widgetphi-functional-build'};
async function gh(path,{method='GET',body}={}){
 const r=await fetch(API+path,{method,headers:{...headers,authorization:'Bearer '+token},
  ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(18000)});
 if(r.status===404)return null;
 const json=await r.json().catch(()=>({}));
 if(!r.ok)throw Error('GitHub HTTP '+r.status+' '+String(json.message||'').slice(0,100));
 return json;
}
function git(...args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}
async function feedback(issue,reply,marker){
 const comments=await gh('/issues/'+issue.number+'/comments?per_page=100')||[];
 if(comments.some(x=>x.body?.includes(marker)))return;
 await gh('/issues/'+issue.number+'/comments',{method:'POST',body:{body:marker+'\n'+reply}});
}
async function processJob(issue){
 if(issue.user?.login!=='www-infinity4')return {status:'pending_creator_authorization'};
 const request=requestFromIssue(issue);if(!request)return{status:'not_job'};
 if(!Number.isInteger(issue.number)||issue.number<=0)return{status:'invalid_issue'};
 const id='issue-'+issue.number,marker='<!-- widgetphi-functional-job:'+id+' -->';
 const complete=await gh('/contents/catalog/generated/'+id+'.html?ref=main');
 if(complete)return{status:'already_merged'};
 const prs=await gh('/pulls?state=all&per_page=100')||[];
 const prior=prs.find(x=>x.body?.includes(marker));
 if(prior)return{status:'existing_pr',url:prior.html_url};
 let result=build(request);
 let model={status:'not_needed'};
 if(result.status==='needs_adapter'){
  model=await askGemini(request,{key:process.env.GEMINI_API_KEY||''});
  if(model.status==='proposed')result=build(request,model.widget);
 }
 if(result.status!=='built'){
  await feedback(issue,'The card bot checked real reusable adapters: '+result.reason+
   '\nNo working card was created until this missing input or adapter is addressed.',
   '<!-- widgetphi-functional-blocked:'+id+':'+result.status+' -->');
  return{status:result.status,reason:result.reason};
 }
 const branch='bot/card-build-'+id;
 git('switch','-c',branch);
 try{
  await mkdir('catalog/generated',{recursive:true});
  await mkdir('catalog/jobs',{recursive:true});
  const receipt={schema:'widgetphi.functional-build/v1',issueNumber:issue.number,request:request.title,
   widget:result.widget,stockSymbols:request.symbols,sourceUrls:request.urls,
   actualAdapter:'src/widgets/'+result.widget+'.js',status:'tested_native_component',
   creator:'www-infinity4',modelPlanning:model.status,walletCharged:false,deployed:false,authorReview:'pending'};
  await writeFile('catalog/generated/'+id+'.html',preview(result));
  await writeFile('catalog/jobs/'+id+'-functional.json',JSON.stringify(receipt,null,2)+'\n');
  execFileSync('npm',['test'],{stdio:'inherit',env:{...process.env,GITHUB_TOKEN:'',GHP:'',GH_TOKEN:'',PHI_BOT_TOKEN:'',GEMINI_API_KEY:''}});
  git('diff','--check');
  git('add','catalog/generated/'+id+'.html','catalog/jobs/'+id+'-functional.json');
  git('-c','user.name=widgetphi-functional-bot[bot]','-c',
   'user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m','Build functional '+result.widget+' for issue '+issue.number);
  git('push','origin','HEAD:refs/heads/'+branch);
  const pr=await gh('/pulls',{method:'POST',body:{head:branch,base:'main',draft:false,
   title:'[Card Build] '+result.widget+' for '+request.title.slice(0,60),
   body:marker+'\nCreated working reusable '+result.widget+' using already tested WidgetPhi adapter.\n'+
    'Native browser assets are linked in a static preview; no wallets or production databases were modified.\n'+
    'Required: passing WidgetPhi CI before merging.\n'+
    'Build receipt: catalog/jobs/'+id+'-functional.json'}})
  await feedback(issue,'The bot built a functional '+result.widget+' preview and submitted it for automated CI: '+pr.html_url,
   '<!-- widgetphi-functional-built:'+id+' -->');
  return{status:'built_pr',pr:pr.html_url};
 }finally{try{git('switch','main')}catch{}}
}
async function main(){
 if(!token||process.env.GITHUB_REPOSITORY!==REPO)throw Error('Repository-scoped GitHub Actions authorization required');
 let issues=[];
 if(name==='issues'){
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  if(!['opened','edited','reopened'].includes(event.action)||!event.issue)return;
  issues=[event.issue];
 }else if(name==='workflow_dispatch'){
  const event=process.env.GITHUB_EVENT_PATH?JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8')):{};
  if(event.inputs?.issue_number){
   const item=await gh('/issues/'+Number(event.inputs.issue_number));if(item)issues=[item];
  }
 }
 if(!issues.length){
  const rows=await gh('/issues?state=open&per_page=100')||[];
  issues=rows.filter(x=>!x.pull_request&&/^\[Card Build\]/i.test(x.title)).slice(0,4);
 }
 for(const issue of issues)try{console.log('card_job_result',JSON.stringify(await processJob(issue)))}
 catch(error){console.error('card_job_error',issue.number,String(error.message||error).slice(0,260));process.exitCode=1}
}
await main();
