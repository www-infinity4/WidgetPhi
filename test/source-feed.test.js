'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const feed = require('../src/widgets/source-feed');
const now = Date.parse('2026-10-23T12:00:00Z');
const story = (id, publishedAt, extra = {}) => ({ title: id, source: 'Test journal', url: 'https://example.org/' + id, publishedAt, topics: ['research'], ...extra });

test('fresh unread first, then archive relevance; independent of incoming order', () => {
  const items = [story('old-low', '2026-09-01', { relevance: .1 }), story('fresh', '2026-10-22'), story('newest', '2026-10-23'), story('old-high', '2026-08-01', { relevance: .9 })];
  const expected = ['newest', 'fresh', 'old-high', 'old-low'];
  assert.deepEqual(feed.selectStories({ items }, now).map(x => x.title), expected);
  assert.deepEqual(feed.selectStories({ items: [...items].reverse() }, now).map(x => x.title), expected);
});
test('next selection excludes previously seen canonical URLs and applies topic filters', () => {
  const items = [story('a', '2026-10-23', { url: 'https://example.org/a?utm_source=x#section' }), story('b', '2026-10-22'), story('other', '2026-10-23', { topics: ['sports'] })];
  assert.deepEqual(feed.selectStories({ items, topics: ['RESEARCH'], seenUrls: ['https://example.org/a'] }, now).map(x => x.title), ['b']);
});
test('rejects bad dates, future stories, absent provenance and unsafe links', () => {
  const items = [story('bad', 'yesterday'), story('future', '2027-01-01'), story('no-source', '2026-10-22', { source: '' }), story('script', '2026-10-22', { url: 'javascript:alert(1)' }), story('credentials', '2026-10-22', { url: 'https://user:pass@example.org/' }), story('ok', '2026-10-22')];
  assert.deepEqual(feed.selectStories({ items }, now).map(x => x.title), ['ok']);
});
test('deduplicates tracking variants and retains stronger same-date relevance', () => {
  const items = [story('a', '2026-10-22'), story('a', '2026-10-22', { url: 'https://example.org/a?utm_campaign=test', relevance: 1 })];
  const selected = feed.selectStories({ items }, now);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].relevance, 1);
});
test('registered renderer produces escaped compact articles and explicit empty state', () => {
  const result = require('../src').handle({ type: 'build_widget', widget: 'source-feed', spec: { title: '<script>', items: [story('<img>', '2020-01-01', { summary: '<script>alert(1)</script>' })] } });
  assert.match(result.html, /&#60;script&#62;/);
  assert.doesNotMatch(result.html, /<script>|<iframe/);
  assert.match(result.html, /Archive/);
  assert.match(feed.build(), /No unread verified matches/);
});
