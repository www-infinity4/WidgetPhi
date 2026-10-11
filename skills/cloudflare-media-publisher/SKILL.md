---
name: cloudflare-media-publisher
description: Cloudflare D1, Workers, secrets and safe rollout skill for isolated Media Star creator catalogs.
---
# Cloudflare Media Publisher (Purple Reign + Grape Escape)
**Trigger:** A real site owner approves publishing a named Media Star gallery/player, adding or removing media, or enabling a creator-specific entitlement backend.

1. **Inventory first:** inspect actual GitHub branch, canonical website Worker route, Cloudflare D1 bindings, secrets (names only), existing StarQuest identity service, and deployed version. Never use guessed database IDs, production secrets or unreviewed schema.
2. **Prepare tenant:** use `workers/media-star-tenants/schema.sql` *additively* in a platform-owned D1. Give every owner a `site_id`; every card a `card_id`; source rows live under composite `site_id,card_id`. Follow the provided schema; do not copy Fred's catalog, StarQuest wallet table, or private user story histories into customer sites.
3. **Owner authorization:** the backend resolves an existing authenticated StarQuest owner from a verified session. Reject owner-supplied `owner_id`, `creator_wallet_id` or `payout_wallet` overrides in public POST bodies. Allow an owner to curate only their own source records; publishing an external video remains link/embed-based unless distribution rights are explicit.
4. **Idempotent jobs:** import = stable `source_key`, job ID; collect = event ID; item changes = version ID; each retry returns the prior result. Maintain `source_url`, source provider, permission, audit status, last checked and a fallback original link.
5. **Provision:** one logical tenant in shared D1 by default. A physically dedicated D1 is optional, requires admin-approved quota/billing and separate Cloudflare API setup, never a browser token. Keep Worker bindings and service routes exactly as currently verified. Encrypt provider keys as Worker secrets.
6. **Release gate:** syntax → integration suite → privacy/rights review → staging smoke → production update → Android source playback test → rollback rehearsal and health receipt. Do not claim a deployment on GitHub merge or a successful Worker upload alone.
7. **Failure response:** if a release breaks the source viewer or wallet entitlement, revert the last Worker version; preserve D1 data. Never drop tables or change balances as a repair.

**Output:** source-specific GitHub PR, migration, deployment checklist, health response, bot repair receipt; exact blocked prerequisite if unavailable. A user never needs to sign up for Cloudflare just to use a catalog card.
