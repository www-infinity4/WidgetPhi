# WidgetPhi

Widget plug-in for the Phi system. When Phi receives a request to build a stick
ticket widget (or any widget), this plug-in builds it using shared styling tokens.

**Status: scaffold only.** See [docs/GPT_INSTRUCTIONS.md](docs/GPT_INSTRUCTIONS.md) for what remains.

```js
const plugin = require('./src');
plugin.handle({ type: 'build_widget', widget: 'stick-ticket', spec: { title: 'Order 12', fields: ['Qty: 2'] } });
```

Test: `npm test`
