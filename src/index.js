'use strict';

const registry = new Map();

function register(widget) {
  if (!widget || typeof widget.name !== 'string' || typeof widget.build !== 'function') throw new Error('Invalid widget');
  registry.set(widget.name, widget);
}

register(require('./widgets/stick-ticket'));
register(require('./widgets/stock-card'));
register(require('./widgets/market-ticker'));
register(require('./widgets/stock-wallet'));
register(require('./widgets/podcast-card'));

function handle(request = {}) {
  if (request.type !== 'build_widget') throw new Error(`Unsupported request type: ${request.type}`);
  const widget = registry.get(request.widget);
  if (!widget) throw new Error(`Unknown widget: ${request.widget}`);
  return { widget: widget.name, html: widget.build(request.spec) };
}

module.exports = { register, handle, list: () => [...registry.keys()] };
