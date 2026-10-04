'use strict';
const test = require('node:test');
const assert = require('node:assert');
const plugin = require('../src/index');

test('builds a stick ticket with stable Phi result contract', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { title: '<A>', fields: ['x'] } });
  assert.equal(r.schema, 'phi.widget-result');
  assert.equal(r.version, 1);
  assert.equal(r.widget, 'stick-ticket');
  assert.match(r.html, /&#60;A&#62;/);
  assert.match(r.html, /stick-ticket__value">x<\/strong>/);
  assert.match(r.html, /data-token-version="phi-omni-2026-10"/);
});

test('accepts labelled fields and escapes content', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { fields: [{ label: 'Qty', value: '<2>' }] } });
  assert.match(r.html, />Qty<\/span>/);
  assert.match(r.html, /&#60;2&#62;/);
});

test('validates malformed specs', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { fields: 'nope' } }), /fields must be an array/);
});

test('rejects unknown widget', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'nope' }));
});
