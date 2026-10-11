---
name: phi-media-repair-watch
description: Robot observers diagnose dead media, failing Code Phi cards, source-index drift and StarQuest accounting using evidence and bounded repairs.
---
# Phi Media Repair Watch (Observer + Pink Panther + Grape Escape)
**Trigger:** source feed returns none, repeated broken Internet Archive items, failed embedded video, stale metadata, no-repeat failure, failed Cloudflare Worker, card CSS break, or discrepancy in StarQuest unlock receipt.

Maintain a source health table and a human-readable bug record. Look at **every provider adapter** (creator files, podcast RSS, Vimeo, YouTube official embeds, Spotify and original X links), not just archive.org. Check HTTP status and official embed capability where permitted; a 200 source page does not prove playable audio. Never bypass authentication, anti-embedding headers, DRM or a license restriction. Log `unchecked`, `blocked_frame`, `unavailable`, `tested_playing` with what was actually observed.

For a dead source: retain original source credit, mark it `unavailable` for that owner if observed, provide a legitimate provider fallback or choose another indexed item; do **not** reuse the same failing media in an infinite loop. Preserve an ordered, bounded list of previous attempts and an original-source link.

Before publishing a repair, compare the live production version to the GitHub branch; stage atomic changes; run mobile screenshots and source/browser smoke tests; verify StarQuest/Quant identity and source buttons; create a PR and merge only after relevant checks pass. If an observer lacks write authority, report a precise issue to the authorized Robot Brain, not a claim of automatic repair or payment.

Separate **content recommendation** from checkout: no watcher can mint, debit or refund by simply discovering a source. Investigate unknown wallet receipts with the ledger before any correction. Trend repeated failures into a reusable skill/adapter improvement proposal.
