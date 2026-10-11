---
name: media-source-discovery
description: When a Phi user searches or collects stories, images, videos or audio, identify media candidates using actual sources, provenance, availability and embed contracts.
---
# Media Source Discovery (Green Beans + Pink Panther)
**Trigger:** Code Phi / Infinity Phi / Omni Phi search, source Collect, media preview failure, or `Find clips about galaxy`.

Read the user's actual current query, selected orange research cards and collected records; do not infer a private collection from their name. Preserve `sourceKey` or Quant reference, title, creator, original HTTPS URL, and time of selection. Deduplicate canonical provider IDs. Call WidgetPhi `src/media-curation.js` `propose({query,collected,sources})` to obtain a reviewable list; do not invent clips.

Source rules: official provider playable embed when documented (YouTube privacy-enhanced, Vimeo, Spotify), original-link fallback for X Spaces and SoundCloud, direct audio/video only when the creator has supplied license or ownership evidence. Wikimedia/creator-hosted images may be used as a gallery **only if display rights are established**. Internet Archive remains an optional supported provider, never the only fallback and never assume a result is playable. A search result title, thumbnail or source URL does not prove audio/video playback. Keep `unchecked`, `tested_playing`, `blocked_frame`, `unavailable` distinct.

**Output:** `phi.media-star.collection/v1` proposal with items, reasons, honest playback statuses and `offer_add_media_star` recommendation when relevant. For a `galaxy` research session containing media, offer “Add Media Star to this website” and preserve that actual collection. A bare `galaxy` search without media prompts “Collect media or find sources first.”

**Acceptance:** Unrelated query cannot fabricate media, no duplicate provider IDs, no unauthorized direct stream, every displayed episode has the original source link. Record why provider fallback was chosen. Do not fetch, download, rip or proxy third-party copyrighted streams to Cloudflare without permission.
