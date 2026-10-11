'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { catalog, normalizeInstance, createSiteManifest } = require('../src/catalog');

test('catalog has unique card IDs and complete configurable definitions', () => {
  assert.equal(new Set(catalog.cards.map(card => card.id)).size, catalog.cards.length);
  assert.ok(catalog.cards.some(card => card.id === 'search-engine'));
  assert.ok(catalog.cards.some(card => card.id === 'research-viewer'));
  assert.ok(catalog.cards.some(card => card.id === 'infinite-stories'));
  for (const card of catalog.cards) {
    assert.ok(card.name && card.summary && Array.isArray(card.settings));
    assert.equal(new Set(card.settings.map(setting => setting.key)).size, card.settings.length);
  }
});
test('owner changes the name, source index and default search mode without cloning templates', () => {
  const instance = normalizeInstance({ instanceId:'card1', cardId:'search-engine', settings:{
    title:'My Fossil Search', mode:'images-first', siteIndex:'ammonites, trilobites'
  }});
  assert.equal(instance.settings.title, 'My Fossil Search');
  assert.equal(instance.settings.mode, 'images-first');
  assert.equal(instance.settings.showViewer, true);
});
test('story instances each retain their own private index and branding', () => {
  const a = normalizeInstance({instanceId:'storiesA',cardId:'infinite-stories',settings:{title:'Dragon Library',index:'fire,dragons'}});
  const b = normalizeInstance({instanceId:'storiesB',cardId:'infinite-stories',settings:{title:'Botany Library',index:'ferns,forests'}});
  assert.notEqual(a.settings.index, b.settings.index);
  assert.equal(a.settings.access, 'free');
});
test('rejects invalid settings, unknown card IDs and duplicate instances', () => {
  assert.throws(() => normalizeInstance({instanceId:'a',cardId:'search-engine',settings:{mode:'anything'}}), /Invalid mode/);
  assert.throws(() => normalizeInstance({instanceId:'a',cardId:'search-engine',settings:{privateApiKey:'secret'}}), /Unknown setting/);
  assert.throws(() => normalizeInstance({instanceId:'a',cardId:'missing'}), /Unknown catalog card/);
  assert.throws(() => createSiteManifest({title:'Test',cards:[
    {instanceId:'duplicate',cardId:'search-engine'},
    {instanceId:'duplicate',cardId:'research-viewer'}
  ]}), /Duplicate card/);
});
test('manifest contains only instance configuration, no client-set tenant or payment claims', () => {
  const manifest = createSiteManifest({title:'My Reading Site',ownerId:'spoofed',cards:[{
    instanceId:'ownReader',cardId:'infinite-stories',
    settings:{title:'Planet Reads',access:'paid',priceStarCoins:5}
  }]});
  assert.equal(manifest.schema, 'widgetphi.site');
  assert.ok(!('ownerId' in manifest));
  assert.equal(manifest.cards[0].settings.priceStarCoins, 5);
  assert.ok(!('walletPaid' in manifest));
});
