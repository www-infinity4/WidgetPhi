'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const plugin = require('../src/index');

test('builds a stick ticket', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { title: '<A>', fields: ['x'] } });
  assert.match(r.html, /&#60;A&#62;/);
  assert.match(r.html, /<li>x<\/li>/);
});

test('registers stock widgets', () => {
  assert.deepEqual(plugin.list(), ['stick-ticket', 'stock-card', 'market-ticker', 'stock-wallet']);
});

test('builds an escaped stock card with provider hook', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stock-card', spec: { symbol: 'googl', exchange: 'nasdaq', company: 'Alphabet <Google>', query: 'Google stock' } });
  assert.match(r.html, /NASDAQ:GOOGL/);
  assert.match(r.html, /Alphabet &#60;Google&#62;/);
  assert.match(r.html, /data-widgetphi-tradingview="symbol-overview"/);
  assert.match(r.html, /data-phi-stock-action="collect"/);
  assert.match(r.html, /data-phi-stock-action="share"/);
});

test('rejects malformed ticker symbols', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'stock-card', spec: { symbol: '<script>' } }), /valid symbol/);
});

test('builds a market ticker', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'market-ticker', spec: { symbols: ['NASDAQ:GOOGL', { exchange: 'NASDAQ', symbol: 'MSFT', label: 'Microsoft' }] } });
  assert.match(r.html, /data-widgetphi-tradingview="ticker"/);
  assert.match(r.html, /data-config=/);
});

test('rejects unknown widget', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'nope' }));
});
