# Infinity Concept Card · Physics Bot Production Contract

**Owner design:** Infinity 2026® · front-only, numbered, 1/1 gold treatment. One card is a reusable site component, not a minted collectible, payment receipt, or proof of historical authorship.

## Bot jobs

- **Source Scout (Blue):** Suggest repeatable, observable physics experiments with an educator or museum source URL. Record an original testable question, materials, procedure, measurable observation, physical explanation and any safety precautions.
- **Science Editor (Orange):** Check the scientific claim, units, source and safety. Keep confirmed scientific facts separate from narrative fiction. Mark unverified proposals as drafts; do not publish invented measurements.
- **Story Writer (Purple):** Optionally attach an original short story to any experiment, another WidgetPhi card, or a site page. Character is a field, not fixed to Julius Sumner Miller. Use the established Reads & Realms idea of an expandable reader inside the card; a story can also link to a published website.
- **Card Builder (Green):** Render the reusable `infinity-concept` widget; use the selected guide character, title, scientific explanation, nested story and source links. Keep one visual face with expandable instructions and story panels.
- **Visual & Functional Tester (Pink):** Reject duplicate experiment IDs, missing sources/materials/steps, unsafe HTML/links, unattributed invented historical quotes, broken details panels, invalid mobile layout and wallet-claiming previews.
- **Publisher (Purple):** For already-reviewed source seeds only, commit a generated static preview and machine-readable receipt to WidgetPhi main after tests. This is not a live QuantaPhi website or a wallet transaction. Proposed new source records still require a reviewed change before entering the seed.

## Actual production path

1. `catalog/physics-experiments.json` holds **six original source-backed starter experiments**, numbered 001–006. They are **Infinity series identifiers**, not a claim to reproduce Julius Sumner Miller's own numbered 1–350 demonstrations.
2. `bots/physics-card-engine.mjs` validates the seed and chooses the earliest non-produced/non-pending ID.
3. Daily `infinity-physics-concepts.yml` invokes `bots/physics-card-runner.mjs` on the main branch. One `catalog/generated/physics-NNN.html` preview and `catalog/jobs/physics-NNN.json` receipt are committed directly to WidgetPhi main after tests, from source rows already reviewed in the seed PR.
4. Duplicates are prevented by committed generated preview filenames and pending branch names. Once the reviewed queue is exhausted, the bot stops and reports that it needs more source-backed experiments; it never silently repeats a card or fabricates the next one.
5. GitHub Actions currently cannot create pull requests under this repository's settings (403). To keep the approved queue working, the bot performs a fast-forward-only push to main of static generated artifacts. Protected-branch denial is a safe stop; review and add new seeds through a separate PR.\n6. Independent `[Card Build] Physics experiment` issues can specify `Experiment: physics-001`, etc. `[Card Build] Infinity Concept ...` issues can specify `Description:`, `Principle:`, `Character:`, `Story Title:`, `Story:` and `Story URL:`.
7. Source Scout/Gemini may propose more candidates, but adding them to the approved JSON queue is a separate reviewed change. To grow toward 350, collect real supported experiments and verify them in batches.

## Generic story contract

For **any native WidgetPhi card**, pass `spec.story={title,body,character,url}` to `handle({type:'build_widget',widget,spec})`. The system attaches a native in-card reader to that widget. The optional `url` must be HTTPS. The standalone Infinity Concept Card can itself be embedded into a site manifest or a published website. The site builder's exported config alone does not perform D1 publishing.

## Authorship and assets

Historical educator names may be listed as *presentation inspirations*. Never imply that a fictional story, custom experiment number, image, or quotation was created by the historical person unless attributed to a verified source. The six science summaries and story miniatures here are newly written, not copies of source pages. Production art is a separate rights-cleared asset step; card generation must succeed without it.

**Safety and wallet boundary:** generated drafts never bill StarCoins, mint tokens, make creator-payment claims, or write to production D1. The receipt records `walletCharged:false` and `deployed:false` until separate systems supply verified authority.
