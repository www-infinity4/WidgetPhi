# Stock widgets

## Search intent

The search layer should resolve a company query to a canonical market symbol before building the card. For example:

`what is Google stock price` → `{ company: "Alphabet Inc.", exchange: "NASDAQ", symbol: "GOOGL" }`

The resolver belongs in the host search/AI layer because company names, share classes and listings change. WidgetPhi validates and renders the supplied symbol; it does not hallucinate a ticker.

## `stock-card`

Required: `symbol`.

Recommended: `exchange`, `company`, `query`, `permalink`.

Optional `quote` fields: `price`, `change`, `changePercent`, `currency`, `asOf`. These are for hosts that already possess a properly licensed quote feed. The default runtime does not scrape values out of the embedded market widget.

## `market-ticker`

Pass up to 15 symbols. Strings can be `EXCHANGE:SYMBOL`; objects can include `exchange`, `symbol`, and `label`.

## Infinity Stock Wallet bridge

Collect writes a normalized stock-card record and dispatches `infinity:stock:collect`. A cloud wallet can listen for that event or provide its own `window.InfinityStockWallet.collect(record)` implementation.
