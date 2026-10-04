'use strict';

const tokens = require('../styles/tokens');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function normalizeField(field, index) {
  if (typeof field === 'string') return { label: `Field ${index + 1}`, value: field };
  if (!field || typeof field !== 'object' || Array.isArray(field)) throw new TypeError(`fields[${index}] must be a string or object`);
  const label = String(field.label ?? '').trim();
  const value = String(field.value ?? '').trim();
  if (!label && !value) throw new TypeError(`fields[${index}] must contain label or value`);
  return { label: label || `Field ${index + 1}`, value };
}

function normalize(spec = {}) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new TypeError('spec must be an object');
  const title = String(spec.title ?? 'Stick Ticket').trim();
  if (!title || title.length > 120) throw new TypeError('title must be 1-120 characters');
  if (!Array.isArray(spec.fields)) throw new TypeError('fields must be an array');
  if (spec.fields.length > 24) throw new TypeError('fields supports at most 24 rows');
  return { title, fields: spec.fields.map(normalizeField) };
}

function build(spec = {}) {
  const data = normalize({ fields: [], ...spec });
  const t = tokens;
  const style = [
    `background:${t.colors.panel}`, `color:${t.colors.text}`, `font-family:${t.fonts.body}`,
    `border:1px solid ${t.colors.line}`, `border-radius:${t.shape.radius}`,
    `padding:${t.spacing.lg}`, `box-shadow:${t.effects.shadow}`
  ].join(';');
  const rows = data.fields.map((f) =>
    `<li><span class="stick-ticket__label">${esc(f.label)}</span><strong class="stick-ticket__value">${esc(f.value)}</strong></li>`
  ).join('');
  return `<section class="stick-ticket" data-phi-widget="stick-ticket" data-token-version="${esc(t.version)}" style="${style}">` +
    `<h2>${esc(data.title)}</h2><ul>${rows}</ul></section>`;
}

module.exports = { name: 'stick-ticket', version: 1, normalize, build };
