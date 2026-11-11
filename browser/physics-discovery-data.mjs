/** Source-led, link-only historic video + original generated physics concepts.
 * All fields are static public records; no embeds of archival video, model
 * impersonation, account access, wallet calls or remote publishing. */
export const heritageClips=Object.freeze([
 Object.freeze({
  id:'miller-1973-optics-intro',
  kind:'archive-link',
  title:'Physics is my business',
  description:'Julius Sumner Miller introduces a 1973 ABC episode about light, optics and modern physics.',
  href:'https://aso.gov.au/titles/tv/why-it-is-so/clip1/',
  credit:'ABC · Australian Screen Online',
  year:1973,
  duration:'1:52'
 }),
 Object.freeze({
  id:'miller-1973-optics-demo',
  kind:'archive-link',
  title:'Optics is very difficult',
  description:'A short authentic excerpt from the same 1973 Australian broadcast.',
  href:'https://aso.gov.au/titles/tv/why-it-is-so/clip2/',
  credit:'ABC · Australian Screen Online',
  year:1973,
  duration:'1:57'
 })
]);

const safeHttps=value=>{
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!!u.hostname&&u.hostname!=='localhost';
 }catch{return false;}
};

/** Only already-produced allow-listed static concepts are discoverable. */
export function discoveryCards(experiments,builtIds){
 if(!Array.isArray(experiments)||!Array.isArray(builtIds))throw new TypeError('Invalid physics catalog');
 const ids=new Set();
 for(const id of builtIds){
  if(typeof id!=='string'||!/^physics-\d{3}$/.test(id))throw Error('Invalid generated physics ID');
  if(ids.has(id))throw Error('Duplicate generated physics ID');
  ids.add(id);
 }
 const seeded=new Map(experiments.map(x=>[x.id,x]));
 return [...ids].map(id=>{
  const e=seeded.get(id);
  if(!e||!Number.isSafeInteger(e.number)||'physics-'+String(e.number).padStart(3,'0')!==id)throw Error('Missing verified experiment for '+id);
  const sources=Array.isArray(e.sources)?e.sources:[];
  if(!sources.length||sources.some(x=>!safeHttps(x?.url)||!x?.label))throw Error('Unsafe or missing source URL for '+id);
  return Object.freeze({
   id,kind:'experiment',title:e.title,description:e.description,principle:e.principle,character:e.character,
   safety:e.safety,href:'../catalog/generated/'+id+'.html',sourceUrls:sources.map(x=>({url:x.url,label:x.label}))
  });
 });
}
