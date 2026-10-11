/** WidgetPhi public-repository card capability census.
 * Public metadata only; never clone secrets, read private source or auto-publish.
 * Pagination covers all visible repositories with bounded GitHub API requests. */
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const origin='https://api.github.com',account='www-infinity4';
const headers={accept:'application/vnd.github+json','user-agent':'widgetphi-capability-scout'};
const categories=[
 {type:'research',words:/search|news|quanta|index|research|phi/i},
 {type:'media',words:/radio|video|tv|media|podcast|creator|music|player/i},
 {type:'reader',words:/read|story|book|novel|library/i},
 {type:'interactive',words:/bitcoin|crusher|game|slot|coin|widget|ticker|stock/i},
 {type:'builder',words:/code|builder|design|web|layout|oracle|starquest/i}
];
export function classify(repo){
 const body=[repo.name,repo.description||''].join(' ');
 return {repository:'www-infinity4/'+repo.name,sourceUrl:repo.html_url,
  candidateKinds:categories.filter(x=>x.words.test(body)).map(x=>x.type),
  evidence:'public_repository_metadata',status:'discovery_only',hasWorkingAdapter:false,
  lastPush:repo.pushed_at||null};
}
export async function scan(fetcher=fetch){
 const rows=[],errors=[];let page=1;
 while(page<=10){
  const path=origin+'/users/'+account+'/repos?per_page=100&type=owner&page='+page;
  let response;try{response=await fetcher(path,{headers,signal:AbortSignal.timeout(12000)})}
  catch(err){errors.push('network_unavailable_at_page_'+page);break}
  if(!response.ok){errors.push('github_http_'+response.status+'_page_'+page);break}
  const list=await response.json();
  if(!Array.isArray(list)){errors.push('invalid_repository_list');break}
  for(const r of list)if(r?.name&&r.full_name?.toLowerCase()===(account+'/'+r.name).toLowerCase()&&!r.archived)rows.push(classify(r));
  if(list.length<100)break;
  page++;
 }
 return {schema:'phi.repo-card-discovery/v1',scannedPublicRepos:rows.length,
  complete:!errors.length&&page<=10,errors,candidates:rows,
  publishableTemplates:0,payableUses:0,requiresReviewer:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const output=await scan(),dir=process.env.CARD_CENSUS_OUTPUT||'card-census-output';
 await mkdir(dir,{recursive:true});
 await writeFile(dir+'/census.json',JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({count:output.scannedPublicRepos,complete:output.complete,errors:output.errors}));
}
