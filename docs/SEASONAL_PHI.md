# TerriPhi + PetriPhi seasonal WidgetPhi

Build with `require('./src').handle({type:'build_widget',widget:'seasonal-card',spec:{mode:'game',seasonal:true,popup:false}})`.

Place the returned `html` in a host page and include `browser/widgetphi-seasonal.js` once. Widgets are inline by default; the host controls any pop-up/modal placement. Seven modes: `game`, `video`, `sound`, `art`, `story`, `costume`, `vintage`.

**Real media only:** `videoUrl` accepts a genuine YouTube, Vimeo, or Internet Archive URL via WidgetPhi video parser. A `vintage` widget uses the host's `imageUrl` and `imageCredit`; acquire usage rights first. An `art` widget requires a deployed `artUrl` to link into PetriPhi.

**Seasonal delivery:** active October 1–31 (visitor local month); set `seasonal:false` for deliberate year-round testing or call `WidgetPhiSeasonal.scan(document,{preview:true})`. Close persists for that card's browser session. No autoplay and no page-open pop-ups are injected by the runtime; the host decides whether/when to show a card.

**Interest routing:** `WidgetPhiSeasonal.chooseMode({images:7,music:3,videos:2})` returns `art`. The host may pass first-party, permissioned activity counts; do not fingerprint visitors or build cross-site profiles.

**Wallet:** star, share, collect and dismiss emit `phi:seasonal:star`, `phi:seasonal:share`, `phi:seasonal:collect`, and `phi:seasonal:dismiss` custom events. These are *requests*, not proof of sharing and not StarCoin mints. A trusted Cloudflare Worker must verify ledger events and idempotency before rewards are issued.

TerriPhi is developed in `www-infinity4/Terra-phi` and PetriPhi in `www-infinity4/Petra-Phi`. Register their production URLs with the host after deploying; repo code alone does not publish a site.

**Host-controlled pop-up:** build a card server-side, insert its returned HTML into a temporary DOM node, then call `WidgetPhiSeasonal.openPopup(cardElement)`. This uses a native accessible dialog, only runs October 1–31 unless `{preview:true}` is deliberately set, and remembers dismissal per session. It will not pop open by itself.
