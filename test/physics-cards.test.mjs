import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chooseNext,validateExperiment,renderExperiment,asDocument} from '../bots/physics-card-engine.mjs';
import {requestFromIssue,build} from '../bots/card-build-engine.mjs';
const require=createRequire(import.meta.url);
const {experiments}=require('../catalog/physics-experiments.json');
const plugin=require('../src/index.js');
test('sourced physics queue produces six nonduplicated experimental concepts',()=>{
 assert.equal(experiments.length,6);
 assert.deepEqual(experiments.map(e=>validateExperiment(e).number),[1,2,3,4,5,6]);
 assert.equal(chooseNext(experiments).id,'physics-001');
 assert.equal(chooseNext(experiments,['physics-001'],['physics-002']).id,'physics-003');
 assert.equal(chooseNext(experiments,experiments.map(e=>e.id)),null);
});
test('physics source, number, safety and steps survive render and generated document',()=>{
 const card=renderExperiment(experiments[0]);
 assert.match(card.html,/INFINITY 2026® · CONCEPT CARD · NO. 001 · 1\/1 DESIGN/);
 assert.match(card.html,/What it demonstrates/);
 assert.match(card.html,/Open experiment instructions/);
 assert.match(card.html,/Read attached story/);
 assert.match(card.html,/sciencebuddies.org/);
 assert.match(card.html,/Safety/);
 assert.equal(card.receipt.storyAttached,true);
 assert.equal(card.receipt.walletCharged,false);
 assert.equal(card.receipt.deployed,false);
 assert.match(asDocument(card),/<meta name="robots" content="noindex">/);
});
test('character is configurable and historical references are not invented citations',()=>{
 const spec={...experiments[1],character:'New fictional guide',type:'physics-experiment'};
 const html=plugin.handle({type:'build_widget',widget:'infinity-concept',spec}).html;
 assert.match(html,/New fictional guide/);
 assert.match(html,/not attributed quotations/);
 assert.doesNotMatch(html,/Julius Sumner Miller/);
});
test('any widget can have its own safe in-card story or external website link',()=>{
 const html=plugin.handle({type:'build_widget',widget:'stick-ticket',spec:{
  title:'Ticket',fields:['Discovery'],story:{title:'The experiment',character:'Ada',
    body:'<script>unsafe()</script> Science story',
    url:'https://example.org/full-story'}
 }}).html;
 assert.match(html,/Read attached story/);
 assert.match(html,/example.org\/full-story/);
 assert.match(html,/&#60;script&#62;/);
 assert.doesNotMatch(html,/<script>/);
 const unsafe=plugin.handle({type:'build_widget',widget:'stick-ticket',spec:{
  title:'Ticket',fields:[],story:{url:'javascript:alert(1)'}
 }}).html;
 assert.doesNotMatch(unsafe,/javascript:alert/);
});
test('bot builds an existing sourced physics experiment from owner issue',()=>{
 const issue={title:'[Card Build] Physics experiment demo',number:58,user:{login:'www-infinity4'},body:'Experiment: physics-004'};
 const r=build(requestFromIssue(issue));
 assert.equal(r.status,'built');
 assert.equal(r.widget,'infinity-concept');
 assert.match(r.html,/Walking Water Without Lifting the Cup/);
 const blocked=build(requestFromIssue({...issue,body:'Build physics experiment'}));
 assert.equal(blocked.status,'needs_source_data');
});
test('bot builds a general concept with attached story from bounded fields',()=>{
 const issue={title:'[Card Build] Infinity Concept portal',number:59,user:{login:'www-infinity4'},
  body:'Description: A proposed original concept with a fictional narrator.\nPrinciple: A testable hypothesis.\nCharacter: Professor Willow\nStory Title: The prototype\nStory: A student looks for evidence.'};
 const card=build(requestFromIssue(issue));
 assert.equal(card.status,'built');
 assert.match(card.html,/A student looks for evidence/);
 assert.match(card.html,/Professor Willow/);
});
test('physics validator rejects unreviewed, unsafe or duplicate records',()=>{
 assert.throws(()=>validateExperiment({...experiments[0],sources:[{url:'javascript:alert(1)',label:'Bad'}]}),/Citable HTTPS/);
 assert.throws(()=>validateExperiment({...experiments[0],id:'physics-011'}),/ID must match/);
 assert.throws(()=>chooseNext([...experiments,experiments[0]]),/Duplicate experiment/);
});
