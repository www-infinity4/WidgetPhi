(function (global) {
  'use strict';
  const WALLET_KEY = 'infinity_stock_wallet_v1';
  const STAR_KEY = 'infinity_stock_stars_v1';

  function parseJSON(value, fallback) { try { return JSON.parse(value); } catch (_) { return fallback; } }
  function read(key, fallback) { try { return parseJSON(localStorage.getItem(key), fallback); } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function payload(card) { return parseJSON(card.getAttribute('data-stock-payload') || '{}', {}); }
  function cardKey(item) { return [item.exchange || '', item.symbol || '', item.company || ''].join(':').toUpperCase(); }
  function nowISO() { return new Date().toISOString(); }

  function emit(name, detail) {
    try { global.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
  }

  function star(card) {
    const item = payload(card); const key = cardKey(item); const stars = read(STAR_KEY, {});
    stars[key] = !stars[key]; write(STAR_KEY, stars);
    const button = card.querySelector('[data-phi-stock-action="star"]');
    if (button) button.setAttribute('aria-pressed', stars[key] ? 'true' : 'false');
    emit('infinity:stock:star', { item, starred: !!stars[key] });
    return !!stars[key];
  }

  function walletItems() { const items = read(WALLET_KEY, []); return Array.isArray(items) ? items : []; }
  function collect(card) {
    const item = payload(card); const key = cardKey(item); const items = walletItems();
    const record = Object.assign({}, item, { key, collectedAt: nowISO() });
    const existing = items.findIndex((x) => x && x.key === key);
    if (existing >= 0) items[existing] = Object.assign({}, items[existing], record); else items.unshift(record);
    write(WALLET_KEY, items.slice(0, 500));
    if (global.InfinityStockWallet && global.InfinityStockWallet !== api && typeof global.InfinityStockWallet.collect === 'function') {
      try { global.InfinityStockWallet.collect(record); } catch (_) {}
    }
    if (typeof global.QuantaStarCredit === 'function') {
      try { global.QuantaStarCredit('collect', `stock:${key}`, { key: `stock:${key}`, type: 'Stock', title: record.company || record.symbol, media: '', symbol: record.symbol, exchange: record.exchange }); } catch (_) {}
    }
    emit('infinity:stock:collect', { item: record });
    renderWallets();
    return record;
  }

  async function share(card) {
    const item = payload(card); const title = `${item.company || item.symbol} (${item.symbol})`;
    const url = item.permalink || location.href; const text = `${title} market card`;
    let completed = false;
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); completed = true; }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); completed = true; }
    } catch (_) { return false; }
    if (completed && typeof global.QuantaStarCredit === 'function') {
      try { global.QuantaStarCredit('share', `stock:${cardKey(item)}:${Date.now()}`, { key: `stock:${cardKey(item)}`, type: 'Stock', title, symbol: item.symbol, exchange: item.exchange }); } catch (_) {}
    }
    emit('infinity:stock:share', { item, completed });
    return completed;
  }

  function tradingViewScript(host, src, config) {
    if (!host || host.dataset.widgetphiHydrated === '1') return;
    host.dataset.widgetphiHydrated = '1';
    const box = document.createElement('div'); box.className = 'tradingview-widget-container';
    const widget = document.createElement('div'); widget.className = 'tradingview-widget-container__widget'; box.appendChild(widget);
    const script = document.createElement('script'); script.type = 'text/javascript'; script.src = src; script.async = true; script.text = JSON.stringify(config);
    box.appendChild(script); host.replaceChildren(box);
  }

  function hydrateMarketWidgets(root) {
    (root || document).querySelectorAll('[data-widgetphi-tradingview="symbol-overview"]').forEach((host) => {
      const symbol = host.getAttribute('data-symbol') || '';
      tradingViewScript(host, 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js', {
        symbols: [[symbol, `${symbol}|1D`]], chartOnly: false, width: '100%', height: 320, locale: 'en', colorTheme: 'light', autosize: false, showVolume: true, showMA: false, hideDateRanges: false, hideMarketStatus: false, hideSymbolLogo: false, scalePosition: 'right', scaleMode: 'Normal', fontFamily: 'Arial, sans-serif', fontSize: '10', noTimeScale: false, valuesTracking: '1', changeMode: 'price-and-percent'
      });
    });
    (root || document).querySelectorAll('[data-widgetphi-tradingview="ticker"]').forEach((host) => {
      let config = {}; try { config = JSON.parse(decodeURIComponent(host.getAttribute('data-config') || '')); } catch (_) {}
      tradingViewScript(host, 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js', config);
    });
  }

  function renderWallet(host) {
    const list = host.querySelector('[data-widgetphi-stock-wallet-list]'); if (!list) return;
    const items = walletItems();
    if (!items.length) { list.innerHTML = '<p>No stock cards collected yet.</p>'; return; }
    list.innerHTML = items.map((x) => `<article class="widgetphi-wallet-row"><strong>${escapeHTML(x.company || x.symbol)}</strong><span>${escapeHTML([x.exchange, x.symbol].filter(Boolean).join(':'))}</span><small>${escapeHTML(x.collectedAt || '')}</small></article>`).join('');
  }
  function renderWallets(root) { (root || document).querySelectorAll('[data-widgetphi-stock-wallet]').forEach(renderWallet); }
  function escapeHTML(value) { return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function mount(root) { hydrateMarketWidgets(root); renderWallets(root); }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-phi-stock-action]'); if (!button) return;
    const card = button.closest('[data-widgetphi-stock-card]'); if (!card) return;
    const action = button.getAttribute('data-phi-stock-action');
    if (action === 'star') { event.preventDefault(); star(card); }
    if (action === 'collect') { event.preventDefault(); collect(card); button.textContent = 'Collected ✓'; }
    if (action === 'share') { event.preventDefault(); share(card).then((ok) => { if (ok) { const old = button.textContent; button.textContent = 'Shared ✓'; setTimeout(() => { button.textContent = old; }, 1400); } }); }
  });

  const api = { mount, hydrateMarketWidgets, walletItems, collect, share, star, renderWallets, WALLET_KEY };
  global.WidgetPhiStock = api;
  if (!global.InfinityStockWallet) global.InfinityStockWallet = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(document)); else mount(document);
})(window);
