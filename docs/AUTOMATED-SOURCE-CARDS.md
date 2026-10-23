# Automated websites in cards

Product rule: creating cards and keeping them in an owned Bubbles repository is free. QuantaPhi advertising placement costs **1,000 StarCoins**. Placement duration is not specified. This is separate from content purchases and creator usage rewards. A draft, template, or model response must never debit a wallet or claim paid publication. Activation requires the authoritative ledger's idempotent settlement receipt linked to the owned card instance.

The `source-feed` reusable renderer now accepts normalized attributed stories and exact topic filters. It displays newest unread matches from the last seven days first, then older matches ranked by the adapter's declared relevance score and date. It rejects unknown/future publication dates, deduplicates canonical URLs, removes tracking parameters, and excludes `seenUrls`. Relevance is an input, not a claim that the model has objectively determined reader value. Filtering uses adapter-provided tags, not a fragile list of spoken commands.

Call the existing `build_widget` API with `widget: source-feed` and `spec: { title, topics, items, seenUrls }`. Each item requires `url` (HTTPS), `source`, `title`, `publishedAt`; optional `summary`, `topics`, and numeric `relevance` (0–1). Rendered summaries are escaped text with original-source links. The caller records a canonical URL as seen only when its story is actually opened, then requests the next selection. No global reader history is shared across users.

## Remaining runtime connections

The existing bot build engine also accepts `request.feed = {items, topics, seenUrls}` when `source-feed` is selected. Gemini may select this adapter, but a proposed choice without attributed content returns `needs_source_data`, not a completed card. The issue-only intake now accepts a bounded structured `Feed JSON` block. It does not fetch the publisher URL: an authorized source adapter or Bubbles must first collect real, attributed items. A submitted item is author-supplied data, not independently verified reporting.

1. Semantic intake produces a validated draft: source identities/URLs, topic/team/person filters, purpose (feed, advertisement, tool), attribution, refresh policy, and destination links. Resolve an existing adapter before generating code. Ambiguous requests retain their uncertainty rather than silently choosing a source.
2. Authorized provider adapters fetch and normalize actual content. Examples: a publisher's Iran coverage; a creator's authorized X sessions with a separate destination link; licensed team scores and sourced recaps; journal/research stories. These examples do not imply provider access, endorsement, playback rights, or a deployed connector. Arbitrary websites are not automatically embeddable. Use permitted summaries and source links where a working embed is unavailable.
3. Refresh jobs update the feed with source timestamps and fetch receipts. On source failure retain the last verified content with an explicit stale status. Never manufacture new publication dates. Scheduled ingestion is not implemented by this renderer.
4. A compact chat-card controller handles next/open, per-reader seen state and refresh; page-work mode remains separately available for Bubbles to inspect and repair the original site. This renderer supplies readable articles, not a completed interactive chat controller.
5. Wallet-confirmed publication activates the placement exactly once. Insufficient funds, retries, and failed publication need ledger/placement integration tests and recoverable state. This patch adds no payment endpoint or client-side balance.
6. Before release, test source freshness, provider playback, mobile controls, chat mounting, and the published QuantaPhi view. Registration and passing unit tests alone are not a live product release.

## Source-linked GitHub issue intake (no provider credentials)

Submit a `[Card Build] Research feed updates` issue with a `Title:` field and a fenced `Feed JSON:` block, for example:

~~~text
Title: Research feed updates
Feed JSON:
```json
{"topics":["research"],"items":[{"title":"Research article title","url":"https://publisher.example/article","source":"Publisher name","publishedAt":"2026-10-23T12:00:00Z","summary":"Attribution-preserving summary","topics":["research"]}]}
```
~~~

The issue parser caps the input at 50 items and refuses malformed JSON, missing source metadata, credentialed or non-HTTPS links. The resulting source-feed widget is a **free card preview**, not a paid placement and not an automatically refreshing hosted feed. This makes source-backed intake usable by an agent without allowing it to invent a headline. Real provider ingestion, refresh schedules, interactive chat, independent publication checks, and authoritative 1,000-StarCoin advertising settlement remain separate runtime gates.
