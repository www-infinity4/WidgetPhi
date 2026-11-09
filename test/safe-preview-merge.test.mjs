import test from 'node:test';
import assert from 'node:assert/strict';
import {allow,hasCurrentIndependentReview} from '../bots/safe-preview-merge.mjs';
const id='450',sha='a'.repeat(40);
const bot={user:{login:'github-actions[bot]'},base:{ref:'main'},
 head:{repo:{full_name:'www-infinity4/WidgetPhi'},ref:'bot/card-build-issue-'+id,sha}};
const paths=['catalog/generated/issue-'+id+'.html','catalog/jobs/issue-'+id+'-functional.json'];
const goodReview=[{state:'APPROVED',commit_id:sha,user:{login:'trusted-reviewer',type:'User'},author_association:'MEMBER',submitted_at:'2026-11-08T22:00:00Z'}];
test('only exact bot-owned, complete, native preview artifacts can be auto merged',()=>{
 assert.equal(allow(bot,paths,[],{localSuitePassed:true,reviews:goodReview}),true);
 assert.equal(allow(bot,[...paths,'cloudflare/catalog-api.mjs'],[],{localSuitePassed:true,reviews:goodReview}),false);
 assert.equal(allow({...bot,user:{login:'random'}},paths,[],{localSuitePassed:true,reviews:goodReview}),false);
 assert.equal(allow({...bot,head:{...bot.head,repo:{full_name:'evil/fork'}}},paths,[],{localSuitePassed:true,reviews:goodReview}),false);
 assert.equal(allow({...bot,base:{ref:'wallet-main'}},paths,[],{localSuitePassed:true,reviews:goodReview}),false);
 assert.equal(allow({...bot,head:{...bot.head,ref:'bot/card-build-issue-450;rm'}},paths,[],{localSuitePassed:true,reviews:goodReview}),false);
});
test('never bypass a failed check or skip verification',()=>{
 assert.equal(allow(bot,paths,[],{localSuitePassed:false}),false);
 assert.equal(allow(bot,paths,[{name:'functional-builder',head_sha:sha,status:'completed',conclusion:'failure'}],{localSuitePassed:true,reviews:goodReview}),false);
 assert.equal(allow(bot,paths,[{name:'functional-builder',head_sha:sha,status:'completed',conclusion:'success'}],{reviews:goodReview}),true);
});

test('reviewed per-run bot branches are eligible only for their own exact issue artifacts',()=>{
 const variant={...bot,head:{...bot.head,ref:'bot/card-build-issue-450-run-42541399824-attempt-2'}};
 assert.equal(allow(variant,paths,[],{localSuitePassed:true,reviews:goodReview}),true);
 assert.equal(allow(variant,['catalog/generated/issue-42541399824.html',paths[1]],[],{localSuitePassed:true,reviews:goodReview}),false);
 for(const ref of ['bot/card-build-issue-450-run-1-attempt-0','bot/card-build-issue-450-run-1-attempt-2;bad'])
  assert.equal(allow({...variant,head:{...variant.head,ref}},paths,[],{localSuitePassed:true,reviews:goodReview}),false);
});

test('bot previews require independent current-head APPROVED review, never just a local test',()=>{
 const author={login:'github-actions[bot]'};
 const reviewer={login:'reviewer-human',type:'User'};
 const approval={state:'APPROVED',commit_id:sha,user:reviewer,author_association:'COLLABORATOR',submitted_at:'2026-11-08T22:00:00Z'};
 assert.equal(hasCurrentIndependentReview(bot,[]),false);
 assert.equal(hasCurrentIndependentReview(bot,[{...approval,state:'COMMENTED'}]),false);
 assert.equal(hasCurrentIndependentReview(bot,[{...approval,commit_id:'b'.repeat(40)}]),false);
 assert.equal(hasCurrentIndependentReview(bot,[{...approval,user:author}]),false);
 assert.equal(hasCurrentIndependentReview(bot,[{...approval,author_association:'NONE'}]),false);
 assert.equal(hasCurrentIndependentReview(bot,[approval]),true);
 assert.equal(hasCurrentIndependentReview(bot,[approval,{...approval,state:'CHANGES_REQUESTED',submitted_at:'2026-11-08T22:05:00Z'}]),false);
 assert.equal(hasCurrentIndependentReview(bot,[{...approval,state:'CHANGES_REQUESTED',submitted_at:'2026-11-08T21:00:00Z'},approval]),true);
 assert.equal(allow(bot,paths,[],{localSuitePassed:true,reviews:[]}),false);
 assert.equal(allow(bot,paths,[],{localSuitePassed:true,reviews:[approval]}),true);
 assert.equal(allow(bot,paths,[],{localSuitePassed:true,reviews:[{...approval,commit_id:'b'.repeat(40)}]}),false);
});
