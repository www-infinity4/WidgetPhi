# WidgetPhi Robot Card Workshop

**Canonical rule:** Build reusable cards from WidgetPhi first. A Phi page may select, configure and mount a card, but must not become a forked copy of QuantaPhi, Omni Phi, Infinity Phi, Code Phi or the original creator's reader.

## Automated pathways

1. **Owner requests a new card:** Open the New Phi card issue form in WidgetPhi (`[Card New] Card title` plus description). The GitHub Actions workshop responds to `issues.opened/edited/reopened`, parses the description as untrusted data and builds a bounded draft PR with a new catalog template, editable owner-specific `title` and `index`, and a build job.
2. **Owner requests a card improvement:** Use Improve an existing Phi card (`[Card Enhance] Card title` and exact existing card ID). A simple new configuration setting can be added automatically *in a draft PR*. A functional request such as image upload, wallet settlement or external-player integration becomes a Green/Pink engineering job **until the actual code, tests and browser evidence exist**.
3. **Bots observe new work across Phi:** `card-workshop.yml` runs every hour, inspects a bounded recent set of commits in named owner repositories, and files a deduplicated WidgetPhi discovery issue with the immutable source commit/path. A discovery does not copy code into unrelated sites or pretend a reusable adapter has been finished.
4. **Other trusted Phi builders:** A server holding an authorized GitHub integration token may emit `repository_dispatch` with `event_type: widgetphi-card-request` and an explicit versioned request. This is not a browser API. Never embed GitHub credentials in a card or public page.

## Operating contract

```text
New card / improve card / owner page design event
                     |
        WidgetPhi intake (validated)
                     |
      Blue: choose existing or new card
                     |
       Green: implement reusable adapter
                     |
         Pink: regressions + preview
                     |
        Purple: verified release gate
                     |
     WidgetPhi catalog / Code Phi renderer
                     |
   Owner's website + isolated settings/content
```

**What the first automation truly does:** It starts a reviewable bot job and creates the smallest safe template/setting change on an isolated branch, with the original feature request embedded as a receipt. It does not pretend to implement unspecified AI behavior, create a customer database per click, or auto-merge/deploy incomplete changes. Automatic fully implemented adapters require a scoped AI code executor wired to WidgetPhi with tests, deployment verification and explicit authorization.

Each new template has a functional **topic-shelf/search starter** in `catalog/embed.js` that can search published data belonging to the mounted website. Its unique advanced feature remains unimplemented until tested.

The bot doesn't write to `catalog/cards.json` in main directly; it only opens a draft pull request after `npm test`. Existing cards and designs remain stable. Scheduled source scan does not claim to execute user actions.

## Bot request schema

```json
{
  "kind": "new",
  "name": "My Garden Reader",
  "description": "Visitors browse cherry-tree history and educational stories.",
  "category": "Reading & Stories",
  "issueNumber": 35
}
```

Enhancement example with schema field only:

```json
{
  "kind": "enhance",
  "name": "Story Writer",
  "cardId": "story-writer",
  "description": "Offer a viewer toggle for public story citations.",
  "setting": {"key":"showCitations","label":"Show citations","type":"boolean","default":true},
  "issueNumber": 36
}
```

The bot's registered automation is `.github/workflows/card-workshop.yml`. Its bounded source scanner also requires that the source path belong to an explicit Phi repo allowlist and a concrete 40-character source commit. It never accepts arbitrary executable source from issue text.

## Page-design handoff still needed

User-design events should go through a **server-side authenticated WidgetPhi bridge** and be translated to an authorized `repository_dispatch` or a WidgetPhi card request. The original Phi builder should send only the reusable capability description and a consented, public source commit, not private customer text or payment data. Neither arbitrary public users nor a browser can send privileged GitHub events directly. The hosted cloud API and identity bridge need that specific authorization work before automatic customer-site submissions are live.

## Verify

`npm test` includes new bot engine tests. GitHub actions separately checks source syntax and tests before it can produce a pull request.

Workflow evidence and PR links are real receipts. No wallet mint/payment from a request or source discovery. A draft or template is **not** a deployed/fully working feature.
