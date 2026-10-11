-- Shop Phi reusable creator-curated storefront and advertisement index.
-- Identity comes from signed WidgetPhi site ownership, never a client wallet ID.
CREATE TABLE IF NOT EXISTS shop_phi_profiles (
 site_id TEXT NOT NULL,
 instance_id TEXT NOT NULL,
 creator_sub TEXT NOT NULL,
 display_name TEXT NOT NULL,
 creator_brand TEXT NOT NULL,
 topic TEXT NOT NULL DEFAULT '',
 price_starcoins INTEGER NOT NULL DEFAULT 1 CHECK(price_starcoins BETWEEN 0 AND 100),
 selection_mode TEXT NOT NULL DEFAULT 'no-repeat-shuffle' CHECK(selection_mode IN ('no-repeat-shuffle','owner-sequence')),
 checkout_state TEXT NOT NULL DEFAULT 'disabled' CHECK(checkout_state IN ('disabled','ledger_verified')),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,instance_id),
 FOREIGN KEY(site_id,instance_id) REFERENCES site_cards(site_id,instance_id)
);
CREATE TABLE IF NOT EXISTS shop_phi_items (
 site_id TEXT NOT NULL,
 instance_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 item_kind TEXT NOT NULL CHECK(item_kind IN ('product','advertisement','store','collection')),
 merchant TEXT NOT NULL,
 source_url TEXT NOT NULL,
 image_url TEXT NOT NULL DEFAULT '',
 price_label TEXT NOT NULL DEFAULT '',
 observed_at TEXT NOT NULL DEFAULT '',
 sponsored INTEGER NOT NULL DEFAULT 0 CHECK(sponsored IN (0,1)),
 sponsor TEXT NOT NULL DEFAULT '',
 affiliate INTEGER NOT NULL DEFAULT 0 CHECK(affiliate IN (0,1)),
 owner_order INTEGER NOT NULL DEFAULT 0,
 state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','retired')),
 created_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,instance_id,item_id),
 UNIQUE(site_id,instance_id,source_url),
 FOREIGN KEY(site_id,instance_id) REFERENCES shop_phi_profiles(site_id,instance_id)
);
CREATE INDEX IF NOT EXISTS idx_shop_phi_public ON shop_phi_items(site_id,instance_id,state,owner_order);
-- This is only evidence of an externally validated StarQuest receipt.
-- No browser action may create this before an authoritative settlement exists.
CREATE TABLE IF NOT EXISTS shop_phi_entitlement_refs (
 viewer_sub TEXT NOT NULL,
 site_id TEXT NOT NULL,
 instance_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 external_receipt TEXT NOT NULL UNIQUE,
 amount_starcoins INTEGER NOT NULL CHECK(amount_starcoins BETWEEN 0 AND 100),
 verified_at INTEGER NOT NULL,
 PRIMARY KEY(viewer_sub,site_id,instance_id,item_id),
 FOREIGN KEY(site_id,instance_id,item_id) REFERENCES shop_phi_items(site_id,instance_id,item_id)
);
