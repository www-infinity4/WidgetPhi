/** Merge ONLY native WidgetPhi preview artifacts after their CI succeeds.
 * Cross-repository code, private cloud deployments and wallet edits never pass. */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const API='https://api.github.com/repos/www-infinity4/WidgetPhi';
const REPO='www-infinity4/WidgetPhi';
const TOKEN=process.env.GITHUB_TOKEN||'';
const header={accept:'application/vnd.github+json',authorization:'Bearer '+TOKEN,'content-type':'application/json','user-agent':'widgetphi-safe-preview-merger'};
async function github(path,{method='GET',body}={}){
 const r=await fetch(API+path,{method,headers:header,...(body?{body:JSON.stringify(body)}:{})});
 const value=await r.json().catch(()=>({}));
 if(!r.ok)throw Error('github '+r.status+' '+String(value.message||'').slice(0,130));
 return value;
}
export function allow(pr,paths,checkRuns,{localSuitePassed=false}={}){
 if(!pr||pr.base?.ref!=='main'||pr.head?.repo?.full_name!==REPO)return false;
 if(!/^bot\/card-build-issue-\d+$/.test(pr.head.ref))return false;
 if(pr.user?.login!=='github-actions[bot]')return false;
 const id=pr.head.ref.split('-').at(-1);
 const expected=['catalog/generated/issue-'+id+'.html','catalog/jobs/issue-'+id+'-functional.json'];
 if(paths.length!==2||!expected.every(path=>paths.includes(path)))return false;
 const matched=checkRuns.filter(x=>x.name==='functional-builder'&&x.head_sha===pr.head.sha);
 if(checkRuns.some(x=>x.conclusion==='failure'||x.conclusion==='cancelled'))return false;
 return localSuitePassed||(matched.length>0&&matched.every(x=>x.status==='completed'&&x.conclusion==='success'));
}
export async function mergeSafe({api=github}={}){
 const prs=await api('/pulls?state=open&per_page=100');const results=[];
 for(const summary of prs.filter(x=>/^bot\/card-build-issue-\d+$/.test(x.head?.ref||'')).slice(0,12)){
  try{
   const pr=await api('/pulls/'+summary.number);
   const files=await api('/pulls/'+summary.number+'/files?per_page=100');
   const runs=await api('/commits/'+pr.head.sha+'/check-runs?per_page=100');
   const paths=files.map(x=>x.filename);
   // GitHub does not fire pull_request workflows for PRs created by GITHUB_TOKEN.
   // Re-run the complete suite on the exact immutable head SHA before merging.
   if(!allow(pr,paths,runs.check_runs||[],{localSuitePassed:true})){
    results.push({pr:summary.number,status:'source_shape_or_ci_blocked'});continue
   }
   if(!/^[a-f0-9]{40}$/.test(pr.head.sha)){results.push({pr:summary.number,status:'invalid_sha'});continue}
   const issueId=pr.head.ref.split('-').at(-1);
   let suitePassed=false;
   try{
    execFileSync('git',['fetch','origin',pr.head.sha],{stdio:'pipe'});
    execFileSync('git',['switch','--detach',pr.head.sha],{stdio:'pipe'});
    const receipt=JSON.parse(readFileSync('catalog/jobs/issue-'+issueId+'-functional.json','utf8'));
    if(receipt.issueNumber!==Number(issueId)||receipt.status!=='tested_native_component'||receipt.walletCharged!==false||receipt.deployed!==false)
     throw Error('build_receipt_mismatch');
    execFileSync('npm',['test'],{stdio:'pipe',timeout:180000,
      env:{...process.env,GITHUB_TOKEN:'',GH_TOKEN:'',GHP:'',GEMINI_API_KEY:''}});
    suitePassed=true;
   }finally{
    execFileSync('git',['switch','main'],{stdio:'pipe'});
   }
   if(!suitePassed){results.push({pr:summary.number,status:'local_test_blocked'});continue}
   if(pr.mergeable!==true||pr.draft){results.push({pr:summary.number,status:'awaiting_mergeability'});continue}
   await api('/pulls/'+pr.number+'/merge',{method:'PUT',body:{sha:pr.head.sha,merge_method:'squash',
     commit_title:'WidgetPhi verified functional card '+pr.head.ref}});
   results.push({pr:summary.number,status:'merged_verified_preview'});
  }catch(e){results.push({pr:summary.number,status:'not_merged',reason:String(e.message).slice(0,120)})}
 }
 return results;
}
if(process.argv[1]?.endsWith('safe-preview-merge.mjs')){
 if(process.env.GITHUB_REPOSITORY!==REPO||!TOKEN)throw Error('Scoped WidgetPhi bot token required');
 console.log(JSON.stringify(await mergeSafe()));
}
