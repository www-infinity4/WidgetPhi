'use strict';

const registry = new Map();

function register(widget) {
  if (!widget || typeof widget.name !== 'string' || typeof widget.build !== 'function') {
    throw new TypeError('Widget must expose { name, build(spec) }');
  }
  registry.set(widget.name, widget);
}

register(require('./widgets/stick-ticket'));

function handle(request = {}) {
  if (request.type !== 'build_widget') throw new Error(`Unsupported request type: ${request.type}`);
  const widget = registry.get(request.widget);
  if (!widget) throw new Error(`Unknown widget: ${request.widget}`);
  const html = widget.build(request.spec);
  return {
    schema: 'phi.widget-result',
    version: 1,
    widget: widget.name,
    widgetVersion: widget.version || 1,
    html
  };
}

module.exports = {
  contract: Object.freeze({ schema: 'phi.widget-plugin', version: 1, handles: ['build_widget'] }),
  register,
  handle,
  list: () => [...registry.keys()]
};
