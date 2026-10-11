---
name: starquest-creator-settlement
description: Plan and verify StarQuest creator-paid Media Star unlocks with authoritative receipt, idempotency and payout accounting.
---
# StarQuest Creator Settlement (Blueberry + Ledger Auditor)
**Trigger:** The card owner opts into charging `N` full StarCoins for the *next new* curated media selection, initially often `1`; another creator may choose another allowed amount.

**Do not implement a faux purchase in browser JavaScript.** First inspect the deployed StarQuest authoritative schema, wallet identity and wallet debit capabilities in `TV-Database/workers/starquest-ledger` and any existing Fred ledger/creator-payout contract. A user-specified display nickname is not a payout wallet ID.

State machine: `draft` → `seller_verified` → `buyer_authenticated` → `entitlement_checked` → `idempotent_order_reserved` → `atomic_ledger_debit_and_creator_credit` → `signed_entitlement_receipt` → `reveal_authorized_link`. For an already-owned episode, return prior receipt and **0 additional StarCoins**. For the creator's preview, allow a server-authenticated `owner_preview` without deducting. Explicit confirmation must occur before the first paid unlock. If insufficient StarCoins, unverified payout recipient, a missing debit/credit contract, or uncertain replay availability, do not charge or reveal paid content.

All steps must run under server-controlled authorization and transactional idempotency keyed by `buyer_id,card_id,item_id` (and a separate request nonce), with immutable append-only receipts. Couple buyer debit, seller credit, unlock right and receipt; a successful button click is **not** settlement. Do not replay/compensate an uncertain charge blindly; reconcile the existing ledger first.

Store title, selected URL source provenance and receipt reference only, not downloaded copyrighted source files. Access price is for **curation and discovery**, not ownership of audio, video or art. Monetization of third-party content must follow provider terms. Freely available original links may still be publicly found; do not present link discovery as an exclusive stream license.

**Safety test:** duplicate clicks, refresh, two-device race, failed transfer, wrong seller, partial payout, owner preview, old entitlement and rollback must all produce consistent results. When authoritative settlement isn't wired, return `paid_unavailable`; WidgetPhi's paid button remains disabled.
