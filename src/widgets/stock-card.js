'use strict';

const tokens = require('../styles/tokens');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const attr = (value) => esc(value).replace(/`/g, '&#96;');

function normalizeTicker(value) {
  const ticker = String(value || '').trim().toUpperCase();
  if (!ticker || !/^[A-Z0-9.^-]{1,16}$/.test(ticker)) throw new Error('stock-card requires a valid symbol');
  return ticker;
}

function normalizeExchange(value) {
  const exchange = String(value || '').trim().toUpperCase();
  if (!exchange) return '';
  if (!/^[A-Z0-9._-]{2,20}$/.test(exchange)) throw new Error('stock-card exchange is invalid');
  return exchange;
}

function jsonAttr(value) {
  return attr(JSON.stringify(value));
}

function quoteMarkup(quote = {}) {
  if (!quote || quote.price === undefined || quote.price === null || quote.price === '') return '';
  const currency = String(quote.currency || 'USD').trim().toUpperCase();
  const price = Number(quote.price);
  if (!Number.isFinite(price)) return '';
  const change = Number(quote.change);
  const pct = Number(quote.changePercent);
  const direction = Number.isFinite(change) ? (change > 0 ? 'positive' : change < 0 ? 'negative' : 'flat') : 'flat';
  const changeText = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '';
  const pctText = Number.isFinite(pct) ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : '';
  const asOf = quote.asOf ? `<span class="widgetphi-stock-asof">${esc(quote.asOf)}</span>` : '';
  return `<div class="widgetphi-stock-snapshot" data-direction="${direction}"><strong>${esc(currency)} ${esc(price.toLocaleString('en-US', { maximumFractionDigits: 4 }))}</strong><span>${esc([changeText, pctText].filter(Boolean).join(' · '))}</span>${asOf}</div>`;
}

function build(spec = {}) {
  const symbol = normalizeTicker(spec.symbol);
  const exchange = normalizeExchange(spec.exchange);
  const tradingViewSymbol = exchange ? `${exchange}:${symbol}` : symbol;
  const company = String(spec.company || spec.name || symbol).trim().slice(0, 180);
  const query = String(spec.query || `${company} stock`).trim().slice(0, 500);
  const permalink = String(spec.permalink || '').trim().slice(0, 1000);
  const walletUrl = String(spec.walletUrl || '').trim().slice(0, 1000);
  const source = String(spec.source || 'TradingView free widget').trim().slice(0, 180);
  const quote = spec.quote && typeof spec.quote === 'object' ? spec.quote : null;
  const payload = { kind: 'stock', symbol, exchange, tradingViewSymbol, company, query, permalink, source, quote: quote || null };
  const style = [
    `background:${tokens.colors.background}`,
    `color:${tokens.colors.text}`,
    `border:1px solid ${tokens.colors.border}`,
    `font-family:${tokens.fonts.body}`
  ].join(';');
  const sourceLine = `<small class="widgetphi-stock-source">Market display: ${esc(source)} · informational, not investment advice</small>`;
  return `<article class="widgetphi-stock-card" data-widgetphi-stock-card data-stock-payload="${jsonAttr(payload)}" data-wallet-url="${attr(walletUrl)}" style="${style}">` +
    `<header class="widgetphi-stock-head"><div><small>STOCK</small><h2>${esc(company)}</h2><p>${esc(tradingViewSymbol)}</p></div><button type="button" class="widgetphi-stock-star" data-phi-stock-action="star" aria-label="Star ${esc(company)}">⭐</button></header>` +
    quoteMarkup(quote) +
    `<div class="widgetphi-stock-live" data-widgetphi-tradingview="symbol-overview" data-symbol="${attr(tradingViewSymbol)}"></div>` +
    `<div class="widgetphi-stock-actions"><button type="button" data-phi-stock-action="share">Share</button><button type="button" data-phi-stock-action="collect">Collect</button></div>` +
    sourceLine +
    `</article>`;
}

module.exports = { name: 'stock-card', build, normalizeTicker, normalizeExchange };
