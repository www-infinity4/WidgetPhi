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
register(require('./widgets/video-feed'));
register(require('./widgets/media-star'));
register(require('./widgets/shop-phi'));
register(require('./widgets/infinity-concept'));

register(require('./widgets/seasonal-card'));

function handle(request = {}) {
  if (request.type !== 'build_widget') throw new Error(`Unsupported request type: ${request.type}`);
  const widget = registry.get(request.widget);
  if (!widget) throw new Error(`Unknown widget: ${request.widget}`);
  const html = widget.build(request.spec);
  const story = request.spec && request.spec.story;
  const result = story && widget.name !== 'infinity-concept'
    ? require('./widgets/infinity-concept').attachStory(html, story) : html;
  return { widget: widget.name, html: result };
}

module.exports = { register, handle, list: () => [...registry.keys()] };
