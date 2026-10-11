/**
 * WidgetPhi hosted catalog API — not deployed by this repository.
 * Requires a D1 binding, a trusted signed Phi identity bridge, and allowed origins.
 * No browser API keys, no self-reported owner IDs, no wallet mint/settlement code.
 */
import catalog from '../catalog/cards.json';
import {mediaPrivate,mediaPublic} from './media-star-api.mjs';

const cardById = new Map(catalog.cards.map(c => [c.id, c]));
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ApiError(status, message); };
const response = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

function cors(request, env, isPublic) {
  const origin = request.headers.get('origin');
  if (isPublic) return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };
  if (!origin) return {};
  const permitted = String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!permitted.includes(origin)) fail(403, 'Origin not permitted');
  return {
    'access-control-allow-origin': origin, 'vary': 'Origin',
    'access-control-allow-headers': 'Authorization,Content-Type',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-max-age': '600'
  };
}
function decodeSegment(part) {
  if (typeof part !== 'string' || !/^[A-Za-z0-9_-]+$/.test(part)) fail(401, 'Invalid session');
  const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
function parseJwtJson(part) {
  try { return JSON.parse(new TextDecoder().decode(decodeSegment(part))); }
  catch { fail(401, 'Invalid session'); }
}
async function authenticatedSub(request, env) {
  const bearer = request.headers.get('authorization') || '';
  if (!bearer.startsWith('Bearer ') || !env.CATALOG_JWT_SECRET || !env.CATALOG_JWT_ISSUER || !env.CATALOG_JWT_AUDIENCE) fail(401, 'Verified Phi session required');
  const token = bearer.slice(7);
  if (token.length > 4096) fail(401, 'Invalid session');
  const parts = token.split('.');
  if (parts.length !== 3) fail(401, 'Invalid session');
  const header = parseJwtJson(parts[0]), claims = parseJwtJson(parts[1]);
  if (header.alg !== 'HS256' || (header.typ && header.typ !== 'JWT')) fail(401, 'Unsupported session');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.CATALOG_JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, decodeSegment(parts[2]),
    new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!valid) fail(401, 'Invalid session signature');
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(claims.exp) || claims.exp <= now || claims.exp > now + 3600 ||
      (claims.nbf && claims.nbf > now) || claims.iss !== env.CATALOG_JWT_ISSUER ||
      claims.aud !== env.CATALOG_JWT_AUDIENCE ||
      typeof claims.sub !== 'string' || claims.sub.length < 8 || claims.sub.length > 256) {
    fail(401, 'Session expired or audience invalid');
  }
  return claims.sub;
}
async function bodyJson(request) {
  const text = await request.text();
  if (text.length > 19000) fail(413, 'Request too large');
  let value; try { value = JSON.parse(text); } catch { fail(400, 'Expected JSON object'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Expected JSON object');
  return value;
}
function limitedString(value, label, max, required = false) {
  if (typeof value !== 'string') fail(400, label + ' must be text');
  const s = value.trim();
  if (s.length > max || (required && !s)) fail(400, 'Invalid ' + label);
  return s;
}
function validId(s) { return typeof s === 'string' && idPattern.test(s); }
function validateSettings(templateId, input) {
  const definition = cardById.get(templateId);
  if (!definition) fail(400, 'Unknown card template');
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Invalid settings');
  const fields = Object.fromEntries(definition.settings.map(f => [f.key, f]));
  for (const key of Object.keys(input)) if (!fields[key]) fail(400, 'Unknown setting ' + key);
  const settings = {};
  for (const f of definition.settings) {
    const v = Object.hasOwn(input, f.key) ? input[f.key] : f.default;
    if (f.type === 'boolean') {
      if (typeof v !== 'boolean') fail(400, 'Invalid ' + f.key);
    } else if (f.type === 'number') {
      if (!Number.isInteger(v) || v < (f.min ?? 0) || v > (f.max ?? 10000)) fail(400, 'Invalid ' + f.key);
    } else if (typeof v !== 'string' || v.length > (f.type === 'textarea' ? 4000 : 500) ||
      (f.type === 'select' && !f.options.includes(v))) fail(400, 'Invalid ' + f.key);
    settings[f.key] = typeof v === 'string' ? v.trim() : v;
  }
  return settings;
}
async function ownSite(db, siteId, owner) {
  if (!validId(siteId)) fail(404, 'Site not found');
  const site = await db.prepare('SELECT * FROM sites WHERE site_id=? AND owner_sub=?').bind(siteId, owner).first();
  if (!site) fail(404, 'Site not found');
  return site;
}
async function ownCard(db, siteId, instanceId) {
  if (!validId(instanceId)) fail(404, 'Card not found');
  const card = await db.prepare('SELECT * FROM site_cards WHERE site_id=? AND instance_id=?')
    .bind(siteId, instanceId).first();
  if (!card) fail(404, 'Card not found');
  return card;
}
async function route(request, env, url, owner) {
  const db = env.CATALOG_DB;
  if (!db) fail(503, 'Catalog database not configured');
  const path = url.pathname, method = request.method;
  if (path === '/api/sites' && method === 'POST') {
    const data = await bodyJson(request), title = limitedString(data.title, 'title', 120, true);
    const siteId = 'site_' + crypto.randomUUID().replace(/-/g, '');
    await db.prepare('INSERT INTO sites(site_id, owner_sub, title) VALUES(?,?,?)')
      .bind(siteId, owner, title).run();
    return response({ siteId, title, published: false }, 201);
  }
  if (path === '/api/sites' && method === 'GET') {
    const result = await db.prepare('SELECT site_id,title,is_published,created_at FROM sites WHERE owner_sub=? ORDER BY created_at DESC LIMIT 100').bind(owner).all();
    return response({ sites: result.results || [] });
  }
  const match = path.match(/^\/api\/sites\/([^/]+)(?:\/(.*))?$/);
  if (!match) fail(404, 'Unknown endpoint');
  const siteId = match[1], action = match[2] || '';
  const site = await ownSite(db, siteId, owner);
  if (!action && method === 'GET') {
    const records = await db.prepare('SELECT instance_id,template_id,settings_json,public_enabled FROM site_cards WHERE site_id=? ORDER BY created_at').bind(siteId).all();
    return response({ site: { siteId, title: site.title, published: !!site.is_published },
      cards: (records.results || []).map(r => ({ instanceId: r.instance_id, cardId: r.template_id, settings: JSON.parse(r.settings_json), published: !!r.public_enabled })) });
  }
  if (action === 'publish' && method === 'POST') {
    await db.prepare("UPDATE sites SET is_published=1,updated_at=datetime('now') WHERE site_id=? AND owner_sub=?").bind(siteId, owner).run();
    return response({ siteId, published: true });
  }
  if (action === 'cards' && method === 'POST') {
    const data = await bodyJson(request);
    if (!validId(data.instanceId)) fail(400, 'Invalid instanceId');
    const settings = validateSettings(data.cardId, data.settings || {});
    const count = await db.prepare('SELECT COUNT(*) AS n FROM site_cards WHERE site_id=?').bind(siteId).first();
    const already = await db.prepare('SELECT 1 AS found FROM site_cards WHERE site_id=? AND instance_id=?').bind(siteId, data.instanceId).first();
    if (!already && count.n >= 80) fail(409, 'Site card limit reached');
    await db.prepare(`INSERT INTO site_cards(site_id,instance_id,template_id,settings_json) VALUES(?,?,?,?)
      ON CONFLICT(site_id,instance_id) DO UPDATE SET template_id=excluded.template_id,
      settings_json=excluded.settings_json,public_enabled=0,updated_at=datetime('now')`)
      .bind(siteId, data.instanceId, data.cardId, JSON.stringify(settings)).run();
    return response({ siteId, instanceId: data.instanceId, cardId: data.cardId, published: false }, already ? 200 : 201);
  }
  const cardMatch = action.match(/^cards\/([^/]+)(?:\/(.*))?$/);
  if (!cardMatch) fail(404, 'Unknown endpoint');
  const instanceId = cardMatch[1], cardAction = cardMatch[2] || '';
  const card = await ownCard(db, siteId, instanceId);
  if (cardAction.startsWith('media/')) {
    try{return await mediaPrivate({request,db,owner,site,card,action:cardAction})}
    catch(e){fail(e.status||500,e.message||'media_api_failure')}
  }
  if (cardAction === 'publish' && method === 'POST') {
    await db.prepare("UPDATE site_cards SET public_enabled=1,updated_at=datetime('now') WHERE site_id=? AND instance_id=?").bind(siteId, instanceId).run();
    return response({ instanceId, published: true });
  }
  if (cardAction === 'content' && method === 'POST') {
    const data = await bodyJson(request);
    const sourceKey = limitedString(data.sourceKey, 'sourceKey', 120, true);
    const title = limitedString(data.title, 'title', 180, true);
    const summary = limitedString(data.summary || '', 'summary', 1200);
    const body = limitedString(data.body || '', 'body', 12000);
    const sourceUrl = limitedString(data.sourceUrl || '', 'sourceUrl', 1000);
    if (sourceUrl && (!/^https:\/\//.test(sourceUrl) || !URL.canParse(sourceUrl))) fail(400, 'HTTPS source URL required');
    if (data.visibility !== 'private' && data.visibility !== 'public') fail(400, 'Choose private or public');
    if (!Array.isArray(data.indexTerms) || data.indexTerms.length > 50 ||
      data.indexTerms.some(x => typeof x !== 'string' || x.length > 80)) fail(400, 'Invalid indexTerms');
    const existing = await db.prepare('SELECT content_id FROM card_content WHERE site_id=? AND instance_id=? AND source_key=?')
      .bind(siteId, instanceId, sourceKey).first();
    if (!existing) {
      const count = await db.prepare('SELECT COUNT(*) AS n FROM card_content WHERE site_id=? AND instance_id=?').bind(siteId, instanceId).first();
      if (count.n >= 5000) fail(409, 'Card content limit reached');
    }
    const contentId = existing ? existing.content_id : 'content_' + crypto.randomUUID().replace(/-/g, '');
    await db.prepare(`INSERT INTO card_content(content_id,site_id,instance_id,source_key,title,summary,body,source_url,index_json,visibility)
      VALUES(?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(site_id,instance_id,source_key) DO UPDATE SET
      title=excluded.title,summary=excluded.summary,body=excluded.body,source_url=excluded.source_url,
      index_json=excluded.index_json,visibility=excluded.visibility,updated_at=datetime('now')`)
      .bind(contentId, siteId, instanceId, sourceKey, title, summary, body, sourceUrl, JSON.stringify(data.indexTerms), data.visibility).run();
    return response({ contentId, sourceKey, visibility: data.visibility }, existing ? 200 : 201);
  }
  fail(404, 'Unknown endpoint');
}
async function publicContent(request, env, url) {
  if (!env.CATALOG_DB) fail(503, 'Catalog database not configured');
  const mediaMatch=url.pathname.match(/^\/public\/sites\/([^/]+)\/cards\/([^/]+)\/media$/);
  if(mediaMatch){
    try{return await mediaPublic(env.CATALOG_DB,mediaMatch[1],mediaMatch[2])}
    catch(e){fail(e.status||500,e.message||'media_api_failure')}
  }
  const search = url.pathname.match(/^\/public\/sites\/([^/]+)\/search$/);
  if (search) {
    const siteId = search[1];
    if (!validId(siteId)) fail(404, 'Site not found');
    const q = limitedString(url.searchParams.get('q') || '', 'search query', 120, true);
    if (q.length < 2) fail(400, 'Search needs at least two characters');
    const data = await env.CATALOG_DB.prepare(`SELECT i.content_id,i.instance_id,i.title,i.summary,i.body,i.source_url,i.index_json
      FROM card_content i JOIN site_cards c ON i.site_id=c.site_id AND i.instance_id=c.instance_id
      JOIN sites s ON s.site_id=c.site_id
      WHERE i.site_id=? AND i.visibility='public' AND s.is_published=1 AND c.public_enabled=1
      AND COALESCE(json_extract(c.settings_json,'$.access'),'free')='free'
      AND instr(lower(i.title || ' ' || i.summary || ' ' || i.index_json), lower(?)) > 0
      ORDER BY i.created_at DESC LIMIT 30`).bind(siteId, q).all();
    return response({ query: q, items: (data.results || []).map(r => ({
      id: r.content_id, instanceId: r.instance_id, title: r.title, summary: r.summary, body: r.body,
      sourceUrl: r.source_url, indexTerms: JSON.parse(r.index_json)
    })) }, 200, { 'cache-control': 'public, max-age=30' });
  }
  const match = url.pathname.match(/^\/public\/sites\/([^/]+)\/cards\/([^/]+)\/content$/);
  if (!match || !validId(match[1]) || !validId(match[2])) fail(404, 'Not found');
  const [siteId, instanceId] = match.slice(1);
  const page = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const data = await env.CATALOG_DB.prepare(`SELECT i.content_id,i.title,i.summary,i.body,i.source_url,i.index_json
    FROM card_content i JOIN site_cards c ON i.site_id=c.site_id AND i.instance_id=c.instance_id
    JOIN sites s ON s.site_id=c.site_id
    WHERE i.site_id=? AND i.instance_id=? AND i.visibility='public'
    AND c.public_enabled=1 AND s.is_published=1
    AND COALESCE(json_extract(c.settings_json,'$.access'),'free')='free'
    ORDER BY i.created_at DESC LIMIT ?`).bind(siteId, instanceId, page).all();
  return response({ items: (data.results || []).map(r => ({
    id: r.content_id, title: r.title, summary: r.summary, body: r.body,
    sourceUrl: r.source_url, indexTerms: JSON.parse(r.index_json)
  })) }, 200, { 'cache-control': 'public, max-age=60' });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url), isPublic = url.pathname.startsWith('/public/');
    let headers = {};
    try {
      headers = cors(request, env, isPublic);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (url.pathname === '/health' && request.method === 'GET')
        return response({ online: true, databaseBound: !!env.CATALOG_DB }, 200, headers);
      if (isPublic) {
        if (request.method !== 'GET') fail(405, 'Method not allowed');
        const result = await publicContent(request, env, url);
        for (const [key,value] of Object.entries(headers)) result.headers.set(key,value);
        return result;
      }
      if (!url.pathname.startsWith('/api/')) fail(404, 'Unknown endpoint');
      const owner = await authenticatedSub(request, env);
      const result = await route(request, env, url, owner);
      for (const [key,value] of Object.entries(headers)) result.headers.set(key,value);
      return result;
    } catch(e) {
      const code = e instanceof ApiError ? e.status : 500;
      if (code === 500) console.error('WidgetPhi catalog request failed', e && e.name);
      return response({ error: code === 500 ? 'Unexpected server error' : e.message }, code, headers);
    }
  }
};
