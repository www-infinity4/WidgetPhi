'use strict';

const registry = new Map();

function register(widget) {
  registry.set(widget.name, widget);
}

register(require('./widgets/stick-ticket'));

// Entry point for the Phi system: handle({ type: 'build_widget', widget, spec })
function handle(request = {}) {
  if (request.type !== 'build_widget') {
    throw new Error(`Unsupported request type: ${request.type}`);
  }
  const widget = registry.get(request.widget);
  if (!widget) {
    throw new Error(`Unknown widget: ${request.widget}`);
  }
  return { widget: widget.name, html: widget.build(request.spec) };
}

module.exports = { register, handle, list: () => [...registry.keys()] };
