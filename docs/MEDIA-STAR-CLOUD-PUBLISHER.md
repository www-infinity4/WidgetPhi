# Media Star creator catalogs — Cloudflare D1 API

## Actual provisioned storage (2026-10-11)
Existing Cloudflare D1: `widgetphi-catalog`, ID `cca7d66c-1bc7-409d-baa7-c88e38493918`. The schema at `workers/media-star-tenants/schema.sql` was run additively against this existing database and the seven new `media_*` tables were confirmed. The original `sites`, `site_cards`, `card_content` and `card_events` tables were not changed.

Every creator media card belongs to an existing authenticated WidgetPhi site. **Do not** create physical D1 databases per item; Media Star data is partitioned by `site_id,card_id`, user ownership is resolved by the existing `CATALOG_JWT_SECRET`-verified site route. The additional `media_sites` tenant row inherits this verified site ID and owner. The user edits the card title, avatar, theme and sources—not the server-owned identity or payout recipient.

## APIs (implemented in repository, not yet publicly deployed)

All writes use the authenticated existing WidgetPhi catalog Worker, not a browser Cloudflare API key:

```
POST /api/sites/:siteId/cards/:instanceId/media/config
POST /api/sites/:siteId/cards/:instanceId/media/items
GET  /api/sites/:siteId/cards/:instanceId/media/items
POST /api/sites/:siteId/cards/:instanceId/media/items/:itemId/publish
GET  /public/sites/:siteId/cards/:instanceId/media
```

The catalog card must have `template_id=media-star`. The server chooses the creator from its signed session. A media-item POST uses an HTTPS **original source** URL with supported provider/format, `itemId`, title and optional description. Duplicate source IDs are not inserted twice. New items start as **private drafts**, with playback `unchecked` and rights `needs_review`; explicit publication creates public provider embeds and original-source links, never an unlicensed media copy. Direct audio/video and image sources publish as original links until rights and playback are independently reviewed.

**Paid access:** a proposed price remains metadata. With any nonzero proposed `priceStarCoins`, the public endpoint returns only **one deterministic free preview item** and `paidUnlocksEnabled:false`; no second source link, user wallet change, creator payout, or entitlement is fabricated. A true buyer → verified creator transaction must be an atomic signed StarQuest ledger operation with a unique order receipt before adding any entitlement. Until that separate backend exists, do not enable an unlocked Next button.

## Acceptance before claiming production
1. Verify the existing Worker service bindings and route ownership; avoid overwriting the QuantaPhi site Worker.
2. Confirm signed `CATALOG_JWT_SECRET`, issuer, audience and owner session bridge are configured. Without those, writes must return 401; the public media read may be empty.
3. Run the Media Star publisher Node24 SQL integration tests, the WidgetPhi existing catalog tests, and the Code Phi website preview tests.
4. Deploy the catalog API with the existing D1 binding `CATALOG_DB`; smoke test one creator site, one original YouTube/Vimeo/Spotify link, one image original link, and a second owner forbidden from editing it.
5. Confirm actual playback on Android. A source URL with HTTP 200 does not prove that a third-party player will play inside the card.
6. Enable priced creator settlement only after authoritative Fred-independent StarQuest double-entry and receipt checks have passed.

## Where the skills reside
- `skills/media-source-discovery/SKILL.md`
- `skills/media-star-card-assembly/SKILL.md`
- `skills/cloudflare-media-publisher/SKILL.md`
- `skills/starquest-creator-settlement/SKILL.md`
- `skills/phi-media-repair-watch/SKILL.md`
- `skills/media-star-registry.json`

The six-hour `bots/media-star-live-watch.mjs` checks the existing public services and creates a deduplicated repair ticket for confirmed failures. It is not a background payment repair service.
