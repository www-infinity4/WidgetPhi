---
name: shopphi-curated-store
description: Build creator-owned Shop Phi store/advertisement cards from actual collected products and URLs, preserve creator identity, and reveal additional curated selections only after authoritative StarQuest settlement.
---
# Shop Phi — Creator-chosen Stores, Products and Ads

**Trigger:** A Phi website owner says “add Shop Phi,” “make my curator store,” “show my advertisements,” “let visitors pay 1 StarCoin to see my next curated choice,” or similar. Use the existing WidgetPhi `shop-phi` component before starting any new repo or database.

## Curation belongs to the author, not an ad targeting model
The human creator chooses what appears in their own collection, the first free pick, the presentation name, the brand, source descriptions and optional sponsored/affiliate labels. For example, a public figure *could* publish their own selection under an authenticated creator identity, but the system must never attribute recommendations to a celebrity without account verification and permission. Other consumers of a card may create their own card instances, without rewriting the original curator’s catalog or attribution.

## Collect and validate
Input is the owner's actual product, store, article or ad source URL, original title, seller, image, observational price/time and category. Reject invented price and availability. Affiliate links must be disclosed. Paid placements must name the sponsor in a clearly visible label. Prefer merchant-owned destination pages over random redirectors. Do not scrape or rehost copyrighted photos without display rights. Product purchase remains at the seller; selling curation does not convey product ownership or imply an exclusive right to the original offer.

## Build a card
Call WidgetPhi `handle({type:"build_widget",widget:"shop-phi",spec:{title,creatorBrand,items,priceStarCoins}})`. Give one creator-chosen item as a free preview. Keep additional paid product/ad URLs **out of public HTML and public JSON** until the backend returns the particular receipt. A preview button must not spend StarCoins or fake settlement; disabled status is explicit until a real payment is connected.

In Code Phi, reuse the existing card installer and fill in owner settings; preserve their existing website. In an automated GitHub job, explicitly provide:
`Item: Product title | https://merchant.example/item`
or
`Ad: Sponsored title | https://merchant.example/offer | Advertiser name`.
The bot must never invent products or use default search results as creator approval.

## Cloudflare
`cloudflare/shop-phi-schema.sql` provides creator-owned site/card indexes inside existing managed `widgetphi-catalog` D1. No separate Cloudflare account needed by customers. Signed owner session controls `shop/config`, `shop/items`, and per-item `publish`; only published rows may appear publicly. One deterministic first selection is released when price is greater than zero; further suggestions are not exposed by unauthenticated endpoints.

## StarQuest paid discovery
One full StarCoin to view the next *curated recommendation*, if chosen by the creator, is a proposed price—not a product purchase and not a payment to a merchant. An eventual checkout must bind authenticated buyer, specific card, precise unseen item, verified creator and a unique order ID; atomically debit the buyer, credit the creator, record entitlement and return a signed scoped receipt. Refresh/repeated taps must not charge twice. Creator rewards on forked WidgetPhi cards remain separate proposed obligations until a real funding source and StarQuest settlement are proven.

## Robot acceptance tests
Check false sponsor endorsement, missing source, link validity, duplicate offer, store owner isolation, refresh duplication, paid-source disclosure, first free item, owner edits and creator attribution. Run the existing WidgetPhi complete tests, deploy only after authorized binding verification, then test on Android that original merchant URLs and Shop Phi buttons work.
