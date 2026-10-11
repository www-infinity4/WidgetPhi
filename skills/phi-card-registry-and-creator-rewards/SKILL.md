---
name: phi-card-registry-and-creator-rewards
description: Discover working Phi card components in Cloudflare by user intent, assemble wallet-owned derivatives, and stage verifiable creator royalty receipts without client-side minting.
---
# Card library, ownership and creator royalties

## One library, many wallet-owned sites
The existing `widgetphi-catalog` D1 is the canonical managed foundation. `phi_card_templates` is the reusable component index; `sites.owner_sub` is the signed wallet identity of a site owner; `site_cards` and `phi_card_lineage` link the chosen template and its derivative ancestry. A customer does not need a Cloudflare login or 1,000 independent D1 databases. A signed authenticated session determines which logical site records they own; never accept `owner_sub`, payout IDs or founding creator from a browser field.

**Ask Code Phi for “add a stock ticker”:** search `GET /public/cards?q=stock%20ticker`; prefer ready `market-ticker` or `stock-card` from WidgetPhi, inspect required settings, ask for the desired stock symbols and market/exchange, then install the existing component in the customer's site. Do not regenerate the ticker from an AI essay. Never claim live stock prices from unconnected provider code.

**Repo with missing card:** use `bots/repo-card-census.mjs` to inventory available public Phi repositories, record immutable path/version evidence, create a review issue, then ask Green to build a tested WidgetPhi adapter. Registration does not mean functioning UI. News Phi headlines, Bitcoin Crusher and others are candidate cards until adapter, mobile preview, real source and controls tests pass. A customizable reel/music-based arcade card must not inherit a real-wagering payment mechanism.

## Reliable recommendations
`src/card-library-discovery.mjs` ranks indexed cards using the user's exact request, keywords, readiness, existing installed cards and observed *local* journey. QuantaPhi can suggest search -> viewer -> reader -> writer -> image builder -> Media Star when those choices make sense. Keep optional sequencing, don't force customers into a fixed path. Do not claim an image generator is already a working WidgetPhi adapter when only the QuantaPhi source component exists.

## Creator chain / Avatar coin editing
An owner customizing a card edits a **new stable instance**: name, avatar, colors, allowed media, stocks, feed/index and personal settings. The server records `phi_card_lineage` and immutable source template; it does not clone the founding creator's private database. Public parent-card forks require the source site and source card to be published. A new owner may fork into their own authenticated site; parent and root remain explicit and never become user-typed payees.

## One tenth StarCoin on qualifying use
Store integer `amount_tenths=1`, not 0.1 as floating-point money. A single verified use can be eligible for a proposed **0.1 StarCoin foundation reward** and a further **0.1 StarCoin direct derivative reward** if the derivative creator qualifies. That is 2 tenths of cost, not free money. The funding rules must be explicit: platform-funded or buyer-funded reserve, one idempotent usage receipt, verification of completed playback/reader action, and a single *atomic* debit/credit/entitlement settlement in authoritative StarQuest. A click or opening the tab is not proof of a paid use. Replays, two-device races and refreshes must not pay twice.

The `phi_creator_royalty_intents` table is a **nonspendable work queue**, not a StarCoin balance. Original creator wallet attribution starts unverified, and no royalty pays until this is resolved against signed wallet identity. Never mint speculative StarCoins, scrape keys, spend users' balances or claim a payout because a GitHub workflow passed. A creator should see *pending*, *confirmed*, or *settled* with source receipt IDs; no fake “paid” badge.

## GPT, Gemini and Cloudflare tools
A website model cannot inherit someone's ChatGPT tool plugins or login state merely because the user says it should. Code Phi needs a server-side **capability broker** exposing a small allowlisted set of actions: public search, read published catalog, prepare site media, create owned site records, prepare migration, preview changes, request approved deploy. Call GPT, Gemini or Cloudflare using a separate authorized integration and scoped credentials held on the server, not a browser token or a shared user password. Record model/version, requested tool, owner, target site, effects, API result, provenance, and undo. Allow broad reading of public sources; require explicit permission for account writes, billing and deployment.

## Robot gates
Source inventory -> de-dup -> select existing component -> adapt only missing behavior -> run CI and mobile interaction/browser tests -> preview -> authorized publish -> receipt -> watcher; if anything fails, stage a PR and preserve the last working card. Apply schemas additively, verify existing tables before migration and **never** merge payout and catalog D1 into one mutable wallet balance.
