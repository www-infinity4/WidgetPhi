---
name: media-star-card-assembly
description: Convert an owner-selected research collection into a customizable, working Media Star/Avatar-like card, preserving site and source identity.
---
# Media Star Card Assembly (Code Phi + WidgetPhi + DesiPhi)
**Trigger:** The human chooses **Add Media Star** after searching “galaxy,” viewing collected source cards, or selecting a WidgetPhi catalog element. Do not automatically add a card merely from a query.

Prepare a stable `site_id`, `card_id`, display title, category, theme, hero, avatar, background, text, controls, price proposal, curator weighting, shuffle policy, and selected source index. An Avatar-coin-like edit changes these **presentation and content settings**, not the data-owner identity, signed ledger recipient, or existing deployed card ID. A renamed Media Star remains a Media Star component.

Call `WidgetPhi.handle({type:"build_widget",widget:"media-star",spec:{title,query,collected,sources,priceStarCoins}})` and include `catalog/media-star-player.js` for client-side free source selection. The card may be named `Fred's Galaxy Room`, `My Art Museum`, etc. Preserve the Code Phi preview until the new component passes visual QA. Keep an explicit **working original-source link** beneath each playback surface. Galleries, sounds, videos and episodes all use the same item registry; a specific provider selects its own playback adapter.

**Cloudflare storage:** use one managed D1 with tenant/site/card indexes by default; do not create a D1 database per source. See `skills/cloudflare-media-publisher/SKILL.md`. Content rights and payments are independent. A paid price in the editor is only a proposal until server settlement is configured. No debit, credit, royalty or playlist transition may occur on refresh.

**Test:** mobile width, rename, no-repeat shuffle, preview text, media provider fallbacks, cloned card retains independent tenant data, cancelled checkout does not reveal a locked item. Publishing requires an authorized versioned site update, not direct AI writes to live HTML.
