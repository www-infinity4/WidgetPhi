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
