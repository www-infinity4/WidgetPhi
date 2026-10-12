/** Deterministic bot planner for sourced Infinity physics cards.
 * New experiment records can be proposed by models, but human/source review is
 * required before a record enters the seed queue. Never invent measurements. */
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const widgetPhi = require('../src/index.js');
const safeUrl = require('../src/widgets/infinity-concept.js').safeUrl;
export function validateExperiment(e) {
  if (!e || !Number.isSafeInteger(e.number) || e.number < 1 || e.number > 350) throw Error('Experiment number must be 1-350');
  if (e.id !== 'physics-' + String(e.number).padStart(3, '0')) throw Error('Experiment ID must match its series number');
  for (const name of ['title','description','principle','safety']) if (typeof e[name] !== 'string' || e[name].trim().length < 15) throw Error('Missing experiment ' + name);
  if (!Array.isArray(e.materials) || !e.materials.length || !Array.isArray(e.steps) || e.steps.length < 2) throw Error('Experiment needs materials and repeatable steps');
  if (!Array.isArray(e.sources) || !e.sources.length || e.sources.some(s => !safeUrl(s.url) || !s.label)) throw Error('Citable HTTPS source required');
  if (!e.character || typeof e.character !== 'string') throw Error('Guide character required');
  return e;
}
export function chooseNext(experiments, committed = [], pending = []) {
  const used = new Set([...committed, ...pending]);
  const numbers = new Set(), titles = new Set();
  for (const e of experiments) {
    validateExperiment(e);
    if (numbers.has(e.number) || titles.has(e.title.toLowerCase())) throw Error('Duplicate experiment number/title');
    numbers.add(e.number); titles.add(e.title.toLowerCase());
  }
  return [...experiments].sort((a,b) => a.number-b.number).find(e => !used.has(e.id)) || null;
}
export function renderExperiment(experiment) {
  const e=validateExperiment(experiment);
  const built=widgetPhi.handle({type:'build_widget',widget:'infinity-concept',spec:{...e,type:'physics-experiment'}});
  return {html:built.html, receipt:{
    schema:'widgetphi.infinity-concept-build/v1',id:e.id,number:e.number,title:e.title,
    widget:'infinity-concept',sourceUrls:e.sources.map(s=>s.url),character:e.character,
    storyAttached:!!(e.story?.body || e.story?.url),
    status:'sourced_draft_requires_ci_and_review',walletCharged:false,deployed:false
  }};
}
export function asDocument(card) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Infinity 2026® Physics Concept Preview</title></head><body style="margin:20px;background:#0e0b1b"><main>'+card.html+'</main></body></html>\n';
}
