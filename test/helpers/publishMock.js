// test/helpers/publishMock.js
// In‑memory mock for WidgetPhi token lifecycle.
// Provides deterministic functions for creating tokens, publishing sites,
// loading content, selling tokens, and editing sites without any external adapters.

let tokenCounter = 1;
const tokens = new Map(); // token -> {owner, content, published, price}

/** Create a new token owned by `owner`. Returns a unique token string. */
export function createToken(owner) {
  const token = `token-${tokenCounter++}`;
  tokens.set(token, { owner, content: null, published: false, price: null });
  return token;
}

/** Set a sale price for a token (used by sellToken validation). */
export function setPrice(token, price) {
  const rec = tokens.get(token);
  if (!rec) throw new Error('invalid_token');
  rec.price = price;
}

/** Publish site content for a token. Returns a mock public URL. */
export function publishSite(token, content) {
  const rec = tokens.get(token);
  if (!rec) throw new Error('invalid_token');
  rec.content = content;
  rec.published = true;
  return `https://quantaphi.org/site/${token}`;
}

/** Load a published site. Returns an object with HTML and a `mobile` flag. */
export function loadSite(token, { mobile } = {}) {
  const rec = tokens.get(token);
  if (!rec || !rec.published) throw new Error('site_not_published');
  const marker = `<div id="site-marker">${token}</div>`;
  const html = `<!DOCTYPE html><html><head><title>Site ${token}</title></head><body>${marker}${rec.content || ''}</body></html>`;
  return { html, mobile: !!mobile };
}

/** Transfer ownership of a token after a successful payment. */
export function sellToken(token, newOwner, payment) {
  const rec = tokens.get(token);
  if (!rec) throw new Error('invalid_token');
  if (rec.price == null) throw new Error('price_not_set');
  if (payment !== rec.price) {
    const err = new Error('payment_failed');
    err.code = 'payment_failed';
    throw err;
  }
  rec.owner = newOwner;
  return true;
}

/** Edit site content; only the current owner may edit. */
export function editSite(token, editor, newContent) {
  const rec = tokens.get(token);
  if (!rec) throw new Error('invalid_token');
  if (rec.owner !== editor) {
    const err = new Error('unauthorized_edit');
    err.code = 'unauthorized_edit';
    throw err;
  }
  rec.content = newContent;
  return true;
}

export default {
  createToken,
  setPrice,
  publishSite,
  loadSite,
  sellToken,
  editSite,
};