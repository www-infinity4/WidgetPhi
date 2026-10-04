# Instructions for GPT: finish WidgetPhi

This repo is a scaffold only. Complete the following:

1. **Styling/IP**: Replace placeholders in `src/styles/tokens.js` with the
   current, up-to-date brand graphics, colors, fonts and assets (logo etc.).
   Ask the owner for the source of truth if unknown; do not invent brand assets.
2. **Stick ticket**: Implement `src/widgets/stick-ticket.js` fully: define the
   spec schema (fields, validation), precise layout, and use tokens only
   (no hard-coded styles). Keep output escaped (see `esc`).
3. **More widgets**: Add a file in `src/widgets/` exporting `{ name, build(spec) }`
   and `register()` it in `src/index.js`; list it in `phi-plugin.json`.
4. **Phi integration**: Confirm the Phi system's plugin contract and adjust
   `phi-plugin.json` and `handle()` in `src/index.js` to match.
5. **Tests**: Extend `test/`; run with `npm test`.
