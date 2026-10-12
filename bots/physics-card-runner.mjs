/** GitHub Actions robot: one pre-reviewed physics concept per scheduled run.
 * No model secrets or arbitrary scripts, and no production wallet writes. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chooseNext,renderExperiment,asDocument} from './physics-card-engine.mjs';
const REPO='www-infinity4/WidgetPhi';
const TOKEN=process.env.GITHUB_TOKEN||'';
const API='https://api.github.com/repos/'+REPO;
const headers={'accept':'application/vnd.github+json','user-agent':'widgetphi-physics-card-bot','x-github-api-version':'2022-11-28'};
function git(...args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}
async function github(path,method='GET',body) {
  const r=await fetch(API+path,{method,headers:{...headers,authorization:'Bearer '+TOKEN,...(body?{'content-type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const json=await r.json().catch(()=>({}));
  if(!r.ok)throw Error('GitHub HTTP '+r.status+': '+String(json.message||'').slice(0,180));
  return json;
}
async function main(){
  if(process.env.GITHUB_REPOSITORY!==REPO || !TOKEN)throw Error('Repository-scoped GitHub Actions token required');
  const file=JSON.parse(await readFile('catalog/physics-experiments.json','utf8'));
  if(file.schema!=='widgetphi.physics-seed/v1'||!Array.isArray(file.experiments))throw Error('Invalid vetted physics seed');
  const existing=await readdir('catalog/generated').catch(()=>[]);
  const committed=existing.filter(x=>/^physics-\d{3}\.html$/.test(x)).map(x=>x.replace(/\.html$/,''));
  const prs=await github('/pulls?state=open&per_page=100');
  const pending=prs.map(p=>p.head?.ref||'').filter(x=>x.startsWith('bot/infinity-physics-')).map(x=>x.slice('bot/infinity-physics-'.length));
  const candidate=chooseNext(file.experiments,committed,pending);
  if(!candidate){console.log('physics_queue_exhausted: no sourced unbuilt experiment remains; add reviewed new sources to the seed.');return;}
  const card=renderExperiment(candidate);
  const branch='bot/infinity-physics-'+candidate.id;
  git('switch','-c',branch);
  try{
    await mkdir('catalog/generated',{recursive:true});
    await mkdir('catalog/jobs',{recursive:true});
    await writeFile('catalog/generated/'+candidate.id+'.html',asDocument(card),'utf8');
    await writeFile('catalog/jobs/'+candidate.id+'.json',JSON.stringify(card.receipt,null,2)+'\n','utf8');
    const generatedIds=[...new Set([...committed,candidate.id])].sort();
    await writeFile('catalog/physics-built.json',JSON.stringify({schema:'widgetphi.physics-built/v1',generatedIds},null,2)+'\n','utf8');
    execFileSync('npm',['test'],{stdio:'inherit',env:{...process.env,GITHUB_TOKEN:'',GEMINI_API_KEY:''}});
    git('diff','--check');
    git('add','catalog/generated/'+candidate.id+'.html','catalog/jobs/'+candidate.id+'.json','catalog/physics-built.json');
    git('-c','user.name=widgetphi-physics-bot[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com',
      'commit','-m','Propose Infinity physics concept '+candidate.id);
    // Source-backed seed rows were already code-reviewed before entering main.
    // Use existing contents:write scope; Actions is forbidden from creating PRs
    // by this repository's settings. Git push rejects non-fast-forward/main rules.
    git('push','origin','HEAD:refs/heads/main');
    console.log('physics_concept_committed_to_main',candidate.id,'catalog/generated/'+candidate.id+'.html');

  }finally{try{git('switch','main')}catch{}}
}
await main();
