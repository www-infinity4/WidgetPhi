'use strict';

const tokens = require('../styles/tokens');

function build(spec = {}) {
  const title = String(spec.title || 'Infinity Stock Wallet').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<section class="widgetphi-stock-wallet" data-widgetphi-stock-wallet style="background:${tokens.colors.background};color:${tokens.colors.text};font-family:${tokens.fonts.body}"><header><h2>${title}</h2><p>Collected market cards</p></header><div data-widgetphi-stock-wallet-list></div></section>`;
}

module.exports = { name: 'stock-wallet', build };
