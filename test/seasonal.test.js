'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const plugin=require('../src');
test('seasonal plugin adds seven working card modes',()=>{
 assert.ok(plugin.list().includes('seasonal-card'));
 ['game','video','sound','art','story','costume','vintage'].forEach(mode=>{
  const html=plugin.handle({type:'build_widget',widget:'seasonal-card',spec:{mode}}).html;
  assert.match(html,/data-widgetphi-seasonal/);
  assert.match(html,/data-ph-action="collect"/);
  assert.doesNotMatch(html,/<audio[^>]*autoplay/);
 });
});
test('seasonal HTML escapes user text and forbids unsafe video',()=>{
 const html=plugin.handle({type:'build_widget',widget:'seasonal-card',spec:{title:'<script>x</script>',mode:'video',videoUrl:'javascript:alert(1)'}}).html;
 assert.match(html,/&#60;script&#62;/);
 assert.doesNotMatch(html,/<iframe/);
 assert.doesNotMatch(html,/javascript:alert/);
 const img=plugin.handle({type:'build_widget',widget:'seasonal-card',spec:{mode:'vintage',imageUrl:'https://example.org/old.jpg',imageCredit:'<a>test</a>'}}).html;
 assert.match(img,/&#60;a&#62;/);
});
test('seasons and popup options are declarative',()=>{
 const html=plugin.handle({type:'build_widget',widget:'seasonal-card',spec:{mode:'game',popup:true,seasonal:false}}).html;
 assert.match(html,/data-ph-popup="1"/);
 assert.match(html,/data-ph-seasonal="0"/);
});