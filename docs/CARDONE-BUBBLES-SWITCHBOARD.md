# Cardone Capital / Bubbles quick card (independent demonstration)

This is a **third-party WidgetPhi prototype**, not a Cardone Capital deployment, endorsement, or an authorized telephone receptionist. The company linked in this example is founded by Grant Cardone. Source links are the official company website, investments, disclosures and contact pages. No private offering details, guaranteed returns, or scraped sales materials are shipped inside the widget. Never mix Gary Cardone with Grant Cardone or imply either person has authorized the service.

## Working repository components
- `src/widgets/cardone-capital.js`: responsive, source-linked independent card. Build via `require('./src').handle({type:'build_widget',widget:'cardone-capital',spec:{title:'Cardone Capital'}})`.
- `browser/widgetphi-cardone.js`: local source-navigation guide responds in the card; same-origin Bubbles API can answer if an authorized endpoint is provided. The first send to live AI needs visitor consent. On API failure, explicitly labeled fallback is shown. User questions are not logged by this frontend.
- `workers/cardone-switchboard/index.mjs`: Twilio-compatible **inbound webhook only** for a separately owned number. Verifies HMAC Twilio signatures, offers DTMF choice and explicit AI consent, and only connects to an administrator-configured secure media stream or verified human number. It includes a bounded, consented Twilio speech-recognition and spoken FAQ fallback for source navigation, but **not a connected LLM**. It has no phone number, carrier, live AI media server, CRM or deployment by itself.
- `catalog/cardone-capital.html`: browser-visible independent demo, no live AI or phone service when unconfigured.

## Mount on a website you control
```js
const card = require('./src').handle({
  type: 'build_widget',
  widget: 'cardone-capital',
  spec: {
    title: 'Cardone Capital',
    instanceId: 'cardone-demo',
    // optional, **only after** secure same-origin owner-controlled endpoint goes live:
    agentEndpoint: '/api/bubbles/cardone'
  }
});
document.getElementById('card-location').innerHTML = card.html;
```
Load `browser/widgetphi-cardone.js` once on that same page. Never embed another party's website in an iframe to bypass policies. `agentEndpoint` must be an actual first-party same-origin route with its own authentication/tenant scoping, CSRF and abuse controls; do not route directly to arbitrary third-party APIs, leak keys, or accept the JSON `agent` field as authority.

### Authorized chat endpoint contract
`POST /api/bubbles/cardone` with `{agent:"cardone-real-estate",instanceId:"cardone-demo",message:"..."}`, UTF-8 JSON. A successful response is `{answer:"..." }` (HTTP 200). Backend should use the server-selected, authenticated tenant and verified knowledge base; strip/reject private identifiers, rate-limit requests, enforce length limits and moderation, attach official source URLs, avoid recommending a specific investment, and require human review for investments, account matters, or transactions. `agent` is an untrusted hint, not a tenant or business authorization token. Do not collect payment cards or SSNs in chat.

### Phone / switchboard
1. Obtain explicit business authorization and a **new/owned test number** from a voice provider (or authorized SIP routing). Do **not** connect Cardone's existing published number without Cardone Capital's permission. Customers can call their published number normally; the card's `tel:` link is just a link.
2. Deploy the Worker on an HTTPS origin configured in `PUBLIC_VOICE_BASE_URL` (origin + trailing slash). Store `TWILIO_AUTH_TOKEN` in encrypted server secrets. Point the owned test number's voice webhook to `POST https://<public-host>/voice`. Never publish the token.
3. For consented AI answering configure `BUBBLES_VOICE_STREAM_URL=wss://<authorized-media-bridge>`. This **requires a separately implemented live media bridge** (Twilio Media Streams, STT, LLM, TTS, interruption/turn-taking, inactivity timeout, recording policy, monitoring); the Worker is only routing and never pretends to synthesize real AI speech.
4. Configure `HUMAN_TRANSFER_NUMBER=+1...` only for a destination that consents to calls. Without this secret, the Worker states human transfer is unavailable. The transfer follows explicit selection; never send phone calls to arbitrary user-supplied digits.
5. Before public launch: consent/disclosures for automated calling, recordings and local laws; telemarketing and TCPA / DNC review when applicable; privacy notice and retention/deletion policy; investor suitability / offering-document compliance; secure CRM; signed call handoff receipts and staff routing; abuse and rate limits; E2E voice latency/permissions tests. No caller credit-card or identity capture is implemented.

## Verification status
Unit tests cover spoofed webhooks, explicit consent, disconnected services, URL escaping, and configured server-only transfers. Browser visuals and live phone answering still require staging deployment and end-to-end physical call verification. Merely merging does not configure an external site, phone number or live AI. 

**Economics:** Private creation is free. QuantaPhi advertising placement is separately gated by the existing **1,000 StarCoin** authoritative ledger settlement; no charges or token minting occur in this card.
