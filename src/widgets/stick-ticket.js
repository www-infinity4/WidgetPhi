'use strict';

const tokens = require('../styles/tokens');

// Scaffold: returns minimal HTML for a stick ticket widget.
// TODO(GPT): implement real layout/fields/styling per docs/GPT_INSTRUCTIONS.md.
function build(spec = {}) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const { title = 'Stick Ticket', fields = [] } = spec;
  const rows = fields.map((f) => `<li>${esc(f)}</li>`).join('');
  return `<div class="stick-ticket" style="background:${tokens.colors.background};color:${tokens.colors.text};font-family:${tokens.fonts.body}">` +
    `<h2>${esc(title)}</h2><ul>${rows}</ul></div>`;
}

module.exports = { name: 'stick-ticket', build };
