# WidgetPhi Card Catalog and Hosted Site Builder

**Purpose:** customers choose individual Phi cards, configure them and attach them to a site. Never fork QuantaPhi/InfinityPhi/OmniPhi or give customers Cloudflare credentials.

## Deliverables on this branch

- `catalog/index.html`: phone-first catalog; category search, configuration fields, site card rack, local previews, copy/download site manifest. Run from HTTP(S), not `file://`.
- `catalog/cards.json`: canonical template definitions and default settings for Search Engine, Research Viewer, Scholastic Reader, Asteroid Reads, Reads & Realms Infinite Stories, Story Writer, Infinity Radio, Media Star, podcast/video, and market widgets.
- `src/catalog.js`: server-side manifest validation for custom card instances. Existing `src/index.js` and existing WidgetPhi cards remain untouched.
- `cloudflare/catalog-schema.sql`: shared D1 tenant/site/card/content tables.
- `cloudflare/catalog-api.mjs`: authenticated API for site creation, per-card configuration, publishing, and custom content. Public reads/search are free/published content only.\n- `catalog/embed.js`: website-side renderer for published reader entries, on-site keyword search and a separate Research Viewer; no outside site is framed.

## Customer flow

1. Choose a card, e.g. **Search Engine**.
2. Rename it, select **images-first**, **AI overview**, **links only**, or **Quanta style**, and choose whether to add the **Research Viewer**.
3. Add it to their site. Every instance has its own `instanceId`, `settings` and server-owned `siteId`.
4. For **Reads & Realms**, choose their own title, subjects/index, genres, original story writer rules, and free/paid intent. The original Phi story database and content **are not copied**.
5. Download/submit a `widgetphi.site` manifest. When the authenticated hosting integration is connected, the Phi backend provisions a site and rows in its central D1 database automatically; the customer **does not log into Cloudflare**.
6. Code Phi renders the cards, DesiPhi styles them, and the Research Viewer uses the user's published, approved data. A remote publisher page that disallows embedding must be linked to, not silently framed.
7. A paid reader requires verified Unified Wallet entitlement on the server. No client event is a StarCoin credit or proof of payment.

## Architecture

```text
WidgetPhi Catalog -> customer site manifest -> authenticated Phi gateway
                                                    |
                                                    v
                                      Cloudflare Worker / D1
                                      - sites(owner_sub)
                                      - site_cards(site_id, instance_id)
                                      - card_content(site_id, instance_id)
                                      - card_events (non-financial)
                                                    |
                                                    v
                                       Code Phi card renderer
                                       + DesiPhi styling
                                       + read-only public API
```

### Why one hosted D1 database first?

A **single application-managed D1 database** with mandatory server-side tenant/site scoping is simpler for the first many users than creating an entire database per reader. Rows are isolated by server-verified owner IDs and UUID site IDs; cards are scoped to sites, and content to card instances. Customers never see the Cloudflare API token. A higher-tier dedicated database per tenant may be added later via an admin-only provisioning queue, with a separate D1 binding and audited migration, **not** direct browser-to-Cloudflare API calls.

## Deploy prerequisites (not done by this PR)

- Apply `catalog-schema.sql` to a D1 database and bind it as `CATALOG_DB` to the Worker.
- Implement a **trusted Phi session bridge** issuing short-lived HS256 JWTs with `iss`, `aud`, `sub`, `exp`. Configure `CATALOG_JWT_SECRET` using Worker secrets **and** matching configured issuer/audience. Never expose the signing secret in browser JavaScript or GitHub.
- Configure `ALLOWED_ORIGINS` for site builder origins, set per-user rate limits, and test deployment in staging before connecting a production site.
- Wire the builder UI to authenticated `/api/sites` and `/api/sites/:id/cards` calls, and Code Phi to the published read endpoints. Current builder deliberately exports a manifest rather than claiming it created cloud records.
- Wire AI research/generation and licensed media catalogs separately. Templates marked `integration` or `template` are not live AI/radio/reader services yet.
- Wire paid access to **authoritative Unified Wallet settlement**, including idempotency/creator payouts/entitlements. Do not expose paid content through the public free-content endpoint.
- Source content needs creator rights, source citations for factual claims, copyright controls and moderation where user uploads are accepted. Respect external frame policies.
- Add retention/privacy controls and a verified export/delete process for tenant data before general release.

## API sketch

```text
GET  /health
POST /api/sites                             (verified session; create site)
GET  /api/sites                             (verified session; own sites)
GET  /api/sites/:siteId                     (verified session; own card list)
POST /api/sites/:siteId/cards               (verified session; upsert instance)
POST /api/sites/:siteId/cards/:instance/publish
POST /api/sites/:siteId/cards/:instance/content (own story/research entries)
POST /api/sites/:siteId/publish
GET  /public/sites/:siteId/cards/:instance/content  (published free entries only)\nGET  /public/sites/:siteId/search?q=...              (published free site-wide search)
```

Example configuration, with no tenant ID supplied by browser:

```json
{
  "schema": "widgetphi.site",
  "version": 1,
  "title": "My Discovery Site",
  "cards": [
    {
      "instanceId": "search1",
      "cardId": "search-engine",
      "settings": {
        "title": "Find Science Pictures",
        "mode": "images-first",
        "siteIndex": "meteorites,asteroids",
        "captureResearch": true,
        "showViewer": true
      }
    }
  ]
}
```

## Test

`npm test` runs existing WidgetPhi checks plus catalog validation. This branch is **not** automatically deployed, and a configured D1 binding/auth issuer must be verified before declaring it live.
