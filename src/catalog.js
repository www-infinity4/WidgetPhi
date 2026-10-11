'use strict';

/**
 * Pure WidgetPhi catalog contract. A catalog entry is a template; a site card
 * instance has its own name, settings and data namespace, never a forked site.
 * This module performs no wallet writes or Cloudflare provisioning.
 */
const catalog = require('../catalog/cards.json');
const definitions = new Map(catalog.cards.map(card => [card.id, card]));
const VALID_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

function fail(message) { throw new Error(message); }
function safeName(value, max = 120) {
  if (typeof value !== 'string') fail('Expected a string');
  const text = value.trim();
  if (!text || text.length > max) fail('Name must be 1 to ' + max + ' characters');
  return text;
}
function normalizeSetting(field, value) {
  const v = value === undefined ? field.default : value;
  if (field.type === 'boolean') {
    if (typeof v !== 'boolean') fail(field.key + ' must be true or false');
    return v;
  }
  if (field.type === 'number') {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < (field.min ?? 0) || v > (field.max ?? 10000)) {
      fail(field.key + ' must be a whole number in range');
    }
    return v;
  }
  if (typeof v !== 'string') fail(field.key + ' must be text');
  if (field.type === 'select' && !field.options.includes(v)) fail('Invalid ' + field.key + ' option');
  if (v.length > (field.type === 'textarea' ? 4000 : 500)) fail(field.key + ' exceeds maximum length');
  return v.trim();
}
function normalizeInstance(instance) {
  if (!instance || typeof instance !== 'object' || Array.isArray(instance)) fail('A card instance object is required');
  const definition = definitions.get(instance.cardId);
  if (!definition) fail('Unknown catalog card: ' + instance.cardId);
  if (typeof instance.instanceId !== 'string' || !VALID_ID.test(instance.instanceId)) fail('Invalid instanceId');
  const input = instance.settings || {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Invalid settings');
  const fields = new Map(definition.settings.map(field => [field.key, field]));
  for (const key of Object.keys(input)) if (!fields.has(key)) fail('Unknown setting: ' + key);
  const settings = Object.fromEntries(definition.settings.map(field => [
    field.key, normalizeSetting(field, input[field.key])
  ]));
  return { instanceId: instance.instanceId, cardId: definition.id, settings };
}
function createSiteManifest(input) {
  if (!input || typeof input !== 'object') fail('Site configuration required');
  const title = safeName(input.title);
  const cards = (input.cards || []).map(normalizeInstance);
  if (cards.length > 80) fail('Too many cards in a site');
  const ids = cards.map(card => card.instanceId);
  if (new Set(ids).size !== ids.length) fail('Duplicate card instance ID');
  return { schema: 'widgetphi.site', version: 1, title, cards };
}
function listCatalog() { return catalog.cards.map(({ id, name, category, summary, readiness }) =>
  ({ id, name, category, summary, readiness })); }
function getCardDefinition(id) { return definitions.get(id) || null; }
module.exports = { catalog, listCatalog, getCardDefinition, normalizeInstance, createSiteManifest };
