import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRequest,requestFromIssue,requestFromSource,applyRequest,slugify,sourcePathAllowed} from '../bots/card-engine.mjs';
import catalog from '../catalog/cards.json' with {type:'json'};

test('new request produces independently configurable template, not a site fork',()=>{
 const raw={kind:'new',name:'Cherry Tree Library',description:'Create owner-specific botanical story cards and reading sequences for a customer website.',issueNumber:45,category:'Reading & Stories'};
 const r=applyRequest(catalog,raw);
 assert.equal(r.changed,true);
 assert.equal(r.reason,'new-template');
 assert.equal(r.catalog.cards.length,catalog.cards.length+1);
 assert.ok(r.catalog.cards.find(x=>x.id==='cherry-tree-library'));
 assert.equal(r.catalog.cards.at(-1).settings[1].key,'index');
 assert.equal(r.job.deployed,false);
 assert.equal(r.job.paid,false);
 assert.equal(catalog.cards.length,12);
});
test('add known safe settings to an existing card, preserving original',()=>{
 const r=applyRequest(catalog,{kind:'enhance',name:'search-engine',cardId:'search-engine',
  description:'Allow a visitor to specify whether embedded sources are opened as links.',
  issueNumber:46,setting:{key:'sourceDisplay',label:'Source display',type:'select',
    options:['in-site','external-link'],default:'in-site'}});
 assert.equal(r.reason,'new-setting');
 assert.equal(r.catalog.cards[0].settings.at(-1).key,'source-display');
 assert.equal(catalog.cards[0].settings.some(x=>x.key==='source-display'),false);
});
test('existing card without schema change becomes engineering task, not faked implementation',()=>{
 const r=applyRequest(catalog,{kind:'enhance',name:'infinite-stories',cardId:'infinite-stories',
 description:'Add a full image upload and server-side story generation workflow.',issueNumber:47});
 assert.equal(r.changed,false);assert.equal(r.reason,'needs-engineering');
 assert.equal(r.job.codeGenerated,false);assert.equal(r.job.deployed,false);
});
test('source discovery proposes review, does not automatically adopt code',()=>{
 const sha='c'.repeat(40);
 const r=requestFromSource({repo:'www-infinity4/QuantaPhi',sha,path:'quanta-story-card.js'});
 assert.equal(r.kind,'discover');
 const result=applyRequest(catalog,r);
 assert.equal(result.changed,false);assert.equal(result.reason,'source-discovery');
 assert.equal(result.catalog,catalog);
});
test('source whitelist ignores credential and generated destinations',()=>{
 assert.equal(sourcePathAllowed('.github/workflows/story-card.yml'),false);
 assert.equal(sourcePathAllowed('src/story-card.js'),true);
 assert.equal(sourcePathAllowed('dist/search.js'),false);
 assert.equal(requestFromSource({repo:'attacker/new-repo',sha:'a'.repeat(40),path:'src/card.js'}),null);
});
test('issue payload requires consistent intent, validates no secret input',()=>{
 const req={kind:'new',description:'Create a custom garden botany and research reader.',category:'Reading & Stories'};
 const issue={title:'[Card New] My Garden Reader',number:12,user:{login:'owner'},body:'<!-- widgetphi-card-request-v1 '+JSON.stringify(req)+' -->'};
 assert.equal(requestFromIssue(issue).cardId,'my-garden-reader');
 assert.throws(()=>normalizeRequest({kind:'new',name:'password reset',description:'Change wallet payments automatically',issueNumber:12}),/Unsafe card name/);
 assert.throws(()=>normalizeRequest({...req,kind:'enhance',name:'card one',issueNumber:12,setting:{key:'API_KEY',label:'API key',type:'text',default:'123'}}),/Unsafe setting key/);
});
test('cannot replace existing template or insert arbitrary script setting',()=>{
 const r=applyRequest(catalog,{kind:'new',name:'Search Engine',description:'Build a new independent searchable site feature.',issueNumber:99});
 assert.equal(r.reason,'card-exists');assert.equal(r.changed,false);
 assert.throws(()=>normalizeRequest({kind:'new',name:'My Card',description:'Build a custom research panel and keyboard.',issueNumber:10,setting:{key:'inject',label:'JS',type:'script',default:''}}),/Unsupported setting type/);
});
test('slug IDs remain consistent and avoid unsafe path traversal',()=>{
 assert.equal(slugify('  Story Writer  '),'story-writer');
 assert.equal(slugify('../../api/admin'),'api-admin');
});
