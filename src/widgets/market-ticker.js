'use strict';

const tokens = require('../styles/tokens');
const { normalizeTicker, normalizeExchange } = require('./stock-card');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function normalizeItem(item) {
  if (typeof item === 'string') {
    const parts = item.trim().split(':');
    if (parts.length === 2) return { exchange: normalizeExchange(parts[0]), symbol: normalizeTicker(parts[1]), label: parts[1].toUpperCase() };
    return { exchange: '', symbol: normalizeTicker(item), label: normalizeTicker(item) };
  }
  const symbol = normalizeTicker(item?.symbol);
  const exchange = normalizeExchange(item?.exchange);
  const label = String(item?.label || item?.company || symbol).trim().slice(0, 80);
  return { exchange, symbol, label };
}

function build(spec = {}) {
  const raw = Array.isArray(spec.symbols) ? spec.symbols : [];
  if (!raw.length) throw new Error('market-ticker requires symbols');
  const symbols = raw.slice(0, 15).map(normalizeItem).map((x) => ({
    proName: x.exchange ? `${x.exchange}:${x.symbol}` : x.symbol,
    title: x.label
  }));
  const config = encodeURIComponent(JSON.stringify({
    symbols,
    showSymbolLogo: true,
    isTransparent: false,
    displayMode: 'adaptive',
    colorTheme: spec.theme === 'dark' ? 'dark' : 'light',
    locale: 'en'
  }));
  return `<section class="widgetphi-market-ticker" data-widgetphi-tradingview="ticker" data-config="${esc(config)}" style="font-family:${tokens.fonts.body}"></section>`;
}

module.exports = { name: 'market-ticker', build };
