'use strict';
const test = require('node:test');
const assert = require('node:assert');
const plugin = require('../src/index');

test('builds a stick ticket', () => {
  const r = plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { title: '<A>', fields: ['x'] } });
  assert.match(r.html, /&#60;A&#62;/);
  assert.match(r.html, /<li>x<\/li>/);
});

test('rejects unknown widget', () => {
  assert.throws(() => plugin.handle({ type: 'build_widget', widget: 'nope' }));
});
