'use strict';
/** Infinity Concept Card: source-led concept/experiment with an optional story.
 * Reusable in any Phi widget or website; no wallet settlement or remote code. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const clean = (value, max = 500) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function safeUrl(value) {
  try {
    const u = new URL(String(value || ''));
    if (u.protocol !== 'https:' || u.username || u.password || /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0)$/i.test(u.hostname)) return '';
    return u.href;
  } catch { return ''; }
}
function detailsList(values, ordered) {
  const rows = (Array.isArray(values) ? values : []).slice(0, 12).map(x => clean(x, 260)).filter(Boolean);
  if (!rows.length) return '';
  return '<' + (ordered ? 'ol' : 'ul') + '>' + rows.map(x => '<li>' + esc(x) + '</li>').join('') + '</' + (ordered ? 'ol' : 'ul') + '>';
}
function storyMarkup(story) {
  if (!story || typeof story !== 'object') return '';
  const title = clean(story.title || 'A story about this concept', 120);
  const body = clean(story.body || '', 3000);
  const character = clean(story.character || '', 100);
  const url = safeUrl(story.url);
  if (!body && !url) return '';
  return '<details class="infinity-concept-story"><summary>Read attached story · ' + esc(title) + '</summary>' +
    '<div class="infinity-concept-story-body"><h3>' + esc(title) + '</h3>' +
    (character ? '<p><strong>Story character:</strong> ' + esc(character) + '</p>' : '') +
    (body ? '<p>' + esc(body).replace(/\n{2,}/g, '</p><p>') + '</p>' : '') +
    (url ? '<p><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Read the full story on its website ↗</a></p>' : '') +
    '</div></details>';
}
const styles = '<style>.widgetphi-infinity-concept,.widgetphi-story-attachment{box-sizing:border-box;max-width:740px;margin:12px 0;padding:clamp(16px,4vw,25px);border:2px solid #c9a452;border-radius:19px;background:linear-gradient(145deg,#2c1a48,#141228);color:#fff8ec;font:400 16px/1.55 system-ui,sans-serif}.widgetphi-infinity-concept *,.widgetphi-story-attachment *{box-sizing:border-box}.widgetphi-infinity-concept h2{font-size:clamp(22px,5vw,30px);line-height:1.15;margin:9px 0}.widgetphi-infinity-concept h3,.widgetphi-story-attachment h3{font-size:17px;margin:12px 0 6px}.widgetphi-infinity-concept p{margin:8px 0}.widgetphi-infinity-concept .ic-top{font-size:12px;letter-spacing:.09em;color:#ffdc85;font-weight:800}.widgetphi-infinity-concept .ic-tag{display:inline-block;margin:5px 6px 0 0;background:#4e3566;border:1px solid #8e6ba7;border-radius:99px;padding:4px 11px;font-size:12px}.widgetphi-infinity-concept details,.widgetphi-story-attachment details{border-top:1px solid #886d9c;margin-top:14px;padding-top:12px}.widgetphi-infinity-concept summary,.widgetphi-story-attachment summary{cursor:pointer;font-weight:750;color:#ffdf96;min-height:42px}.widgetphi-infinity-concept a,.widgetphi-story-attachment a{color:#ffdf96;overflow-wrap:anywhere}.widgetphi-infinity-concept a:focus-visible,.widgetphi-story-attachment a:focus-visible,.widgetphi-infinity-concept summary:focus-visible,.widgetphi-story-attachment summary:focus-visible{outline:3px solid #fff;outline-offset:4px}.widgetphi-infinity-concept li{margin:6px 0}.widgetphi-infinity-concept .ic-source{font-size:13px}.widgetphi-infinity-concept .ic-safety{border-left:3px solid #f0bc61;padding:6px 10px;background:#42304d}.widgetphi-infinity-concept .ic-foot{font-size:12px;color:#ead9c8;margin-top:16px}</style>';
function build(spec = {}) {
  const type = clean(spec.type || 'concept', 24);
  if (!['concept','physics-experiment','invention','research','story'].includes(type)) throw Error('Unsupported concept type');
  const title = clean(spec.title || '', 120);
  if (title.length < 3) throw Error('Concept needs a title');
  const description = clean(spec.description || spec.question || '', 700);
  const principle = clean(spec.principle || '', 800);
  const materials = Array.isArray(spec.materials) ? spec.materials : [];
  const steps = Array.isArray(spec.steps) ? spec.steps : [];
  const sources = (Array.isArray(spec.sources) ? spec.sources : []).slice(0, 8)
    .map(x => typeof x === 'string' ? { url:x, label:'' } : x).map(x => ({
      url:safeUrl(x?.url), label:clean(x?.label || 'Educational reference', 120)
    })).filter(x => x.url);
  if (type === 'physics-experiment' && (!principle || !materials.length || !steps.length || !sources.length))
    throw Error('Physics experiments require principle, materials, steps and an HTTPS educational source');
  const character = clean(spec.character || 'Oracle Guide', 100);
  const number = Number.isSafeInteger(spec.number) && spec.number > 0 ? String(spec.number).padStart(3, '0') : '';
  const id = clean(spec.id || 'infinity-concept-' + (number || 'new'), 80).replace(/[^a-zA-Z0-9_-]/g,'-');
  const story = storyMarkup(spec.story);
  const sourcesHtml = sources.length ? '<details><summary>Sources &amp; further reading (' + sources.length + ')</summary><ul>' +
    sources.map(x => '<li><a href="' + esc(x.url) + '" rel="noopener noreferrer" target="_blank">' + esc(x.label) + '</a></li>').join('') + '</ul></details>' : '';
  return '<section id="' + esc(id) + '" class="widgetphi-infinity-concept" data-infinity-concept="' + esc(type) + '">' + styles +
    '<div class="ic-top">INFINITY 2026® · CONCEPT CARD' + (number ? ' · NO. ' + number : '') + ' · 1/1 DESIGN</div>' +
    '<h2>' + esc(title) + '</h2><span class="ic-tag">' + esc(type.replaceAll('-', ' ')) +
    '</span><span class="ic-tag">Guide: ' + esc(character) + '</span>' +
    (description ? '<p>' + esc(description) + '</p>' : '') +
    (principle ? '<section aria-label="Scientific explanation"><h3>What it demonstrates</h3><p>' + esc(principle) + '</p></section>' : '') +
    (materials.length || steps.length ? '<details><summary>Open experiment instructions</summary><h3>Materials</h3>' +
      detailsList(materials, false) + '<h3>Procedure</h3>' + detailsList(steps, true) +
      (spec.safety ? '<p class="ic-safety"><strong>Safety:</strong> ' + esc(clean(spec.safety, 450)) + '</p>' : '') +
      '</details>' : '') + story + sourcesHtml +
    '<p class="ic-foot">Original Infinity concept design. Guide characters are presentation choices, not attributed quotations or evidence that a historical educator performed this exact demonstration.</p></section>';
}
/** Adds a read-in-place story to ANY already-rendered card, without editing that card's data. */
function attachStory(cardHtml, story) {
  const addition = storyMarkup(story);
  return addition ? '<div class="widgetphi-story-attachment">' + styles + cardHtml + addition + '</div>' : cardHtml;
}
module.exports = {name:'infinity-concept',build,attachStory,safeUrl};
