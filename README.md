# WidgetPhi

Reusable widget plug-in for the Phi system.

WidgetPhi now includes the original stick-ticket scaffold plus reusable market widgets:

- `stock-card` — a Card Oracle-style stock shell with ⭐, Share and Collect controls.
- `market-ticker` — a reusable scrolling ticker for stocks or other TradingView-supported symbols.
- `stock-wallet` — renders the locally collected Infinity Stock Wallet view.

## Market-data rule

WidgetPhi deliberately separates **market display** from **Phi ownership/actions**. The default browser runtime hydrates TradingView's free embeddable widgets, keeping the quote/chart inside the provider's attributed display. Phi owns the surrounding card, query context, sharing, collection, StarCoin hooks and wallet metadata. A host with its own properly licensed market API can also pass a `quote` snapshot into `stock-card` without changing the card contract.

This avoids pretending that a no-cost API key automatically grants public redistribution rights for exchange data.

## Example

```js
const plugin = require('./src');
const card = plugin.handle({
  type: 'build_widget',
  widget: 'stock-card',
  spec: {
    company: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    symbol: 'GOOGL',
    query: 'Google stock',
    permalink: 'https://quantaphi.org/?q=Google%20stock'
  }
});
```

Insert `card.html` into the page and load `browser/widgetphi-stock.js` once. The runtime hydrates the market display and wires the stock-card actions.

### QuantaPhi action bridge

If the host exposes `window.QuantaStarCredit`, WidgetPhi uses that existing Collect/Share credit path. It also dispatches:

- `infinity:stock:star`
- `infinity:stock:collect`
- `infinity:stock:share`

Collected cards are stored under `infinity_stock_wallet_v1` as a browser fallback so a future cloud stock-wallet sink can import them without changing the widget contract.

Test with `npm test`.
