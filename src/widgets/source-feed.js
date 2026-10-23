'use strict';

// Provider adapters supply attributed summaries; never ingest arbitrary page scripts.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
function sourceUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    return u.href;
  } catch { return null; }
}

function selectStories(spec = {}, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error('Invalid clock');
  const seen = new Set((Array.isArray(spec.seenUrls) ? spec.seenUrls : []).map(sourceUrl).filter(Boolean));
  const topics = (Array.isArray(spec.topics) ? spec.topics : []).slice(0, 30).map(x => String(x).trim().toLowerCase()).filter(Boolean);
  const unique = new Map();
  for (const raw of (Array.isArray(spec.items) ? spec.items : []).slice(0, 500)) {
    if (!raw || typeof raw !== 'object') continue;
    const url = sourceUrl(raw.url);
    const published = Date.parse(raw.publishedAt);
    const title = String(raw.title || '').trim().slice(0, 200);
    const source = String(raw.source || '').trim().slice(0, 100);
    // Unknown/future timestamps cannot masquerade as breaking news.
    if (!url || !title || !source || !Number.isFinite(published) || published > now || seen.has(url)) continue;
    const tags = (Array.isArray(raw.topics) ? raw.topics : []).map(x => String(x).trim().toLowerCase());
    if (topics.length && !topics.some(x => tags.includes(x))) continue;
    const relevance = Number.isFinite(raw.relevance) ? Math.max(0, Math.min(1, raw.relevance)) : 0;
    const item = { url, title, source, publishedAt: new Date(published).toISOString(), published,
      summary: String(raw.summary || '').trim().slice(0, 1200), relevance,
      fresh: now - published <= 7 * 86400000 };
    const previous = unique.get(url);
    if (!previous || item.published > previous.published || (item.published === previous.published && item.relevance > previous.relevance)) unique.set(url, item);
  }
  return [...unique.values()].sort((a, b) => Number(b.fresh) - Number(a.fresh) ||
    (a.fresh ? b.published - a.published || b.relevance - a.relevance : b.relevance - a.relevance || b.published - a.published) || a.url.localeCompare(b.url));
}

function build(spec = {}) {
  const items = selectStories(spec);
  return '<section class="widgetphi-source-feed" style="background:white;color:#202035;border:1px solid #ddd;border-radius:16px;padding:16px">' +
    '<h2>' + esc(String(spec.title || 'Source feed').slice(0, 120)) + '</h2>' +
    '<p>Newest unread matches first; older matches follow by relevance.</p>' +
    (items.length ? '<ol>' + items.map(x => '<li><article><h3><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) +
      '</a></h3><p>' + esc(x.source) + ' · <time datetime="' + x.publishedAt + '">' + x.publishedAt.slice(0, 10) + '</time>' +
      (x.fresh ? '' : ' · Archive') + '</p><p>' + esc(x.summary) + '</p></article></li>').join('') + '</ol>' :
      '<p>No unread verified matches are available. Refresh the connected source or adjust the filters.</p>') + '</section>';
}
module.exports = { name: 'source-feed', sourceUrl, selectStories, build };
