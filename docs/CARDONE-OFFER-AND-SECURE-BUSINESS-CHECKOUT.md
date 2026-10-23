# Cardone Capital offer-first quick card — 2026-10-23

## Proven sources
- Featured property: [10X Westshore South](https://cardonecapital.com/westshoresouth/). The property's own page describes **608 apartments**, approximately **52 waterfront acres** along Old Tampa Bay, and **5% targeted cashflow** (not a guaranteed return).
- Official image (externally hosted): https://cardonecapital.com/wp-content/uploads/2026/09/10X-Westshore.jpg . Attribution remains visible. Do not rehost, crop into advertising, syndicate, or run paid promotional placement without rights clearance.
- Fund documents (issuer-owned): https://invest.cardonecapital.com/ ; official risk notices: https://cardonecapital.com/disclosures/ . The property page makes clear that an actual offer is only through current offering materials.
- Current offer state, financial claims, property details and images must be revalidated before advertising; a source page is not a provider contract or endorsement.

## User experience
1. Lead with the **actual property image** and a click-through directly to the issuer, not a fabricated offer link. Display issuer-attributed factual details and a risk notice.
2. Offer Bubbles as a **real estate research assistant**, separating source-navigation FAQs from any permitted actual live AI endpoint. Server-selected tenant IDs, independent identity, anti-abuse limits, consent, citations, and prompt-injection controls are required for real AI deployment.
3. Allow website visitors to open the actual property materials and learn about risk, management fees, liquidity, accredited-investor rules, and who to contact. No unapproved endorsement or claim that Grant has personally joined.
4. QuantaPhi's own hosted `/cardone-capital.html` can mount the existing Bubbles specialist embed by linking to QuantaPhi's Bubbles platform. That does **not** automatically install code on Cardone Capital's site or enable the owner's phone.
5. Do not claim that copying trending pages guarantees Google ranking. The user-facing source card adds unique original explanations and links; avoid mass-duplicated keyword pages, inaccurate claims of breaking news, and content made only to manipulate search.

## Business sign-in and calls — owner acceptance contract
- An OAuth/OIDC or passkey login must verify a company's **real operator**, with business-domain authorization and separately approved roles for **merchant_admin**, **support_agent** and **read_only**; merely declaring an identity or phone number in a URL does not grant ownership.
- Operator may authorize and audit individual channels: owned business test number, official business phone trunk, AI-answering, recordings/retention, call transfers, contact handling, payment provider, and publication. Revocations take effect server-side.
- Incoming number requires its provider's signed webhooks, compliant consent notice, no raw PAN in audio/transcripts, opt-out/hang-up and human handoff when appropriate; these are independent of the site's chatbot. The existing `workers/cardone-switchboard/` remains **unconfigured**, not an active service.
- Claims about securities/returns, sales authority, KYC/AML, accredited status, identity verification, investment suitability, contract signing and final issuer acceptance need current offering disclosures, regulated-provider tools and authorization. An AI bot must never silently impersonate a human representative or issue unverifiable sales receipts.

## Payment architecture and private ledger
`workers/business-checkout/index.mjs` is an **adapter contract**, NOT a live merchant integration. It cannot process a payment without:
1. A verified merchant operator session (`BUSINESS_AUTH.verifyMerchantSession`), server-owned product/price/recurrence metadata (`BUSINESS_CATALOG.getApprovedProduct`), and the operator's explicit approval to accept that class of product.
2. An approved provider adapter (`PAYMENT_GATEWAY.createHostedCheckout`) that returns a provider-hosted URL (for example Stripe Checkout with Google Pay where eligible) and stores customer payment methods **only with the provider**. The platform does not collect or read PAN, CVV, ACH credentials or bank-login details. Monthly billing is controlled by a provider-saved token and consent for a published, cancelable subscription.
3. Provider webhook verification (`PAYMENT_GATEWAY.verifyWebhook`) with signature and anti-replay checking plus durable, idempotent `PRIVATE_RECEIPTS.applyVerifiedEvent` transaction in a tenant-scoped **private** database. No card or bank details enter that ledger.
4. Confirmed refunds and chargebacks reverse status when provider events verify; buyers receive access to their **private** receipts through authenticated portal queries, merchants get tenant-scoped summaries.
5. GitHub stores only source revision, card version, nonidentifying reference/hash of the receipt and verification status if there's an authorized need; the purchase document and buyer identity remain in encrypted private storage. Do **not** expose receipt URLs containing tokenized credentials or buyer data in public commits.

**Securities exception:** Cardone's real estate fund interests are not generic site merchandise. The current integration explicitly denies attempting to checkout a `security` or `real_estate_investment`. Buyers must use the issuer's authorized offering/subscription portal and obtain required eligibility checks and agreements. The separate payment engine may support approved **non-security services** once provider contracts, merchant access, and privacy controls are tested. No payment is yet connected, and no sale has occurred.

## Before merge/deploy
- `npm test`, browser checks for the linked image and web source, blocked transaction test, simulated signed webhooks, duplicate events, external checkout origin allowlist, owner revocation and long-call testing.
- Confirm assets usage rights and official Cardone Capital approval before any sponsored QuantaPhi placement; QuantaPhi's separate **1,000 StarCoin** placement ledger still gates paid advertising.
- Do not connect Grant's private phone or merchant payment accounts without his specific authorization.
