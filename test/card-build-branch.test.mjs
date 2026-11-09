import test from 'node:test';
import assert from 'node:assert/strict';
import {createCardBuildBranch,parseCardBuildBranch} from '../bots/card-build-branch.mjs';

test('every real workflow run/attempt gets a distinct source-pinned card build branch',()=>{
 const one=createCardBuildBranch({issueNumber:22,runId:42541399824,attempt:1});
 const another=createCardBuildBranch({issueNumber:22,runId:42541399824,attempt:2});
 const next=createCardBuildBranch({issueNumber:22,runId:42541399825,attempt:1});
 assert.equal(one,'bot/card-build-issue-22-run-42541399824-attempt-1');
 assert.notEqual(one,another);assert.notEqual(one,next);
 assert.deepEqual(parseCardBuildBranch(one),{issueNumber:22,runId:42541399824,attempt:1,legacy:false});
});

test('legacy bot branches are only recognized, never overwritten as new attempts',()=>{
 assert.deepEqual(parseCardBuildBranch('bot/card-build-issue-22'),{issueNumber:22,runId:null,attempt:null,legacy:true});
 assert.notEqual(createCardBuildBranch({issueNumber:22,runId:42541399824,attempt:1}),'bot/card-build-issue-22');
 for(const bad of ['bot/card-build-issue-22-evil','bot/card-build-issue-22-run-33',
  'bot/card-build-issue-22-run-33-attempt-0','bot/card-build-issue-22-run-33-attempt-1;rm',
  'bot/card-build-issue-0','bot/card-build-issue-22-run-33-attempt-1/extra'])
  assert.equal(parseCardBuildBranch(bad),null,bad);
});

test('missing runner identity never falls back to an overwrite-prone fixed branch',()=>{
 for(const candidate of [{issueNumber:22,runId:'',attempt:1},{issueNumber:22,runId:0,attempt:1},
   {issueNumber:22,runId:1,attempt:0},{issueNumber:'22;rm',runId:1,attempt:1}])
  assert.throws(()=>createCardBuildBranch(candidate),/invalid_card_build_identity/);
});
