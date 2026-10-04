'use strict';

/*
 * Shared Phi visual tokens.
 * Source: Omni-Phi/assets/style.css :root (current production-facing Phi shell).
 * Keep this file asset-free: WidgetPhi consumes values, not brand artwork.
 */
module.exports = {
  version: 'phi-omni-2026-10',
  source: 'www-infinity4/Omni-Phi/assets/style.css',
  colors: {
    background: '#030613',
    backgroundRaised: '#080b24',
    text: '#f8f5ff',
    muted: '#aca8ca',
    accent: '#7c3cff',
    accentAlt: '#a96cff',
    blue: '#43b8ff',
    orange: '#ff8a1f',
    panel: 'rgba(10, 11, 42, .78)',
    line: 'rgba(191, 144, 255, .35)'
  },
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  spacing: { sm: '8px', md: '14px', lg: '24px' },
  shape: { radius: '28px' },
  effects: { shadow: '0 24px 80px rgba(0, 0, 0, .45)' },
  assets: { logo: null }
};
