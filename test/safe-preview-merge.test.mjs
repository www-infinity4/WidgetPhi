import test from 'node:test';
import assert from 'node:assert/strict';
import {allow} from '../bots/safe-preview-merge.mjs';
const id='450',sha='a'.repeat(40);
const bot={user:{login:'github-actions[bot]'},base:{ref:'main'},
 head:{repo:{full_name:'www-infinity4/WidgetPhi'},ref:'bot/card-build-issue-'+id,sha}};
const paths=['catalog/generated/issue-'+id+'.html','catalog/jobs/issue-'+id+'-functional.json'];
test('only exact bot-owned, complete, native preview artifacts can be auto merged',()=>{
 assert.equal(allow(bot,paths,[],{localSuitePassed:true}),true);
 assert.equal(allow(bot,[...paths,'cloudflare/catalog-api.mjs'],[],{localSuitePassed:true}),false);
 assert.equal(allow({...bot,user:{login:'random'}},paths,[],{localSuitePassed:true}),false);
 assert.equal(allow({...bot,head:{...bot.head,repo:{full_name:'evil/fork'}}},paths,[],{localSuitePassed:true}),false);
 assert.equal(allow({...bot,base:{ref:'wallet-main'}},paths,[],{localSuitePassed:true}),false);
 assert.equal(allow({...bot,head:{...bot.head,ref:'bot/card-build-issue-450;rm'}},paths,[],{localSuitePassed:true}),false);
});
test('never bypass a failed check or skip verification',()=>{
 assert.equal(allow(bot,paths,[],{localSuitePassed:false}),false);
 assert.equal(allow(bot,paths,[{name:'functional-builder',head_sha:sha,status:'completed',conclusion:'failure'}],{localSuitePassed:true}),false);
 assert.equal(allow(bot,paths,[{name:'functional-builder',head_sha:sha,status:'completed',conclusion:'success'}]),true);
});

test('reviewed per-run bot branches are eligible only for their own exact issue artifacts',()=>{
 const variant={...bot,head:{...bot.head,ref:'bot/card-build-issue-450-run-42541399824-attempt-2'}};
 assert.equal(allow(variant,paths,[],{localSuitePassed:true}),true);
 assert.equal(allow(variant,['catalog/generated/issue-42541399824.html',paths[1]],[],{localSuitePassed:true}),false);
 for(const ref of ['bot/card-build-issue-450-run-1-attempt-0','bot/card-build-issue-450-run-1-attempt-2;bad'])
  assert.equal(allow({...variant,head:{...variant.head,ref}},paths,[],{localSuitePassed:true}),false);
});
