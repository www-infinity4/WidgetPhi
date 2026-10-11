-- WidgetPhi / Media Star creator content contract. Additive schema template.
-- Run only in a dedicated managed tenant-media D1 AFTER account authorization.
-- No StarCoin debit or wallet balances stored here.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS media_sites (
 site_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 site_name TEXT NOT NULL,
 canonical_origin TEXT,
 created_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','active','suspended'))
);
CREATE UNIQUE INDEX IF NOT EXISTS media_sites_owner ON media_sites(owner_account_id,site_id);
CREATE TABLE IF NOT EXISTS media_cards (
 site_id TEXT NOT NULL REFERENCES media_sites(site_id),
 card_id TEXT NOT NULL,
 display_name TEXT NOT NULL,
 settings_json TEXT NOT NULL DEFAULT '{}',
 price_starcoins INTEGER NOT NULL DEFAULT 0 CHECK(price_starcoins BETWEEN 0 AND 100),
 settlement_state TEXT NOT NULL DEFAULT 'disabled'
 CHECK(settlement_state IN ('disabled','verified_creator_ledger')),
 creator_account_id TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,card_id)
);
CREATE TABLE IF NOT EXISTS media_items (
 site_id TEXT NOT NULL,
 card_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 source_key TEXT NOT NULL,
 source_url TEXT NOT NULL,
 provider TEXT NOT NULL,
 media_kind TEXT NOT NULL CHECK(media_kind IN ('image','video','audio')),
 player_mode TEXT NOT NULL CHECK(player_mode IN ('original_link','provider_embed','direct_media','image_original')),
 title TEXT NOT NULL,
 creator_label TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 rights_state TEXT NOT NULL DEFAULT 'needs_review' CHECK(rights_state IN ('needs_review','approved')),
 playback_state TEXT NOT NULL DEFAULT 'unchecked' CHECK(playback_state IN ('unchecked','tested_playing','blocked_frame','unavailable')),
 source_evidence_json TEXT NOT NULL DEFAULT '{}',
 visibility TEXT NOT NULL DEFAULT 'draft' CHECK(visibility IN ('draft','published','retired')),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,card_id,item_id),
 FOREIGN KEY(site_id,card_id) REFERENCES media_cards(site_id,card_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS media_items_source ON media_items(site_id,card_id,source_key);
CREATE INDEX IF NOT EXISTS media_items_by_card ON media_items(site_id,card_id,visibility,media_kind);
CREATE TABLE IF NOT EXISTS media_import_receipts (
 site_id TEXT NOT NULL,
 card_id TEXT NOT NULL,
 import_id TEXT NOT NULL,
 source_kind TEXT NOT NULL,
 accepted INTEGER NOT NULL DEFAULT 0,
 rejected INTEGER NOT NULL DEFAULT 0,
 summary_json TEXT NOT NULL DEFAULT '{}',
 created_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,card_id,import_id),
 FOREIGN KEY(site_id,card_id) REFERENCES media_cards(site_id,card_id)
);
CREATE TABLE IF NOT EXISTS media_card_rolls (
 viewer_account_id TEXT NOT NULL,
 site_id TEXT NOT NULL,
 card_id TEXT NOT NULL,
 request_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 round_number INTEGER NOT NULL DEFAULT 1,
 selected_at INTEGER NOT NULL,
 PRIMARY KEY(viewer_account_id,site_id,card_id,request_id),
 FOREIGN KEY(site_id,card_id,item_id) REFERENCES media_items(site_id,card_id,item_id)
);
CREATE INDEX IF NOT EXISTS media_rolls_recent ON media_card_rolls(viewer_account_id,site_id,card_id,selected_at DESC);
CREATE TABLE IF NOT EXISTS media_playback_reports (
 viewer_account_id TEXT NOT NULL,
 site_id TEXT NOT NULL,
 card_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('heard','unavailable','blocked_frame')),
 evidence_kind TEXT NOT NULL CHECK(evidence_kind IN ('owner_report','observer_check','player_event')),
 reported_at INTEGER NOT NULL,
 PRIMARY KEY(viewer_account_id,site_id,card_id,item_id),
 FOREIGN KEY(site_id,card_id,item_id) REFERENCES media_items(site_id,card_id,item_id)
);
-- This is a mirror/index of *externally verified* entitlement receipts, never
-- the authoritative debit/payout ledger. The authenticated server must check
-- StarQuest before adding a row. A row here can never mint StarCoins.
CREATE TABLE IF NOT EXISTS media_entitlement_refs (
 viewer_account_id TEXT NOT NULL,
 site_id TEXT NOT NULL,
 card_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 external_receipt_id TEXT NOT NULL UNIQUE,
 creator_account_id TEXT NOT NULL,
 amount_starcoins INTEGER NOT NULL CHECK(amount_starcoins BETWEEN 0 AND 100),
 verified_at INTEGER NOT NULL,
 PRIMARY KEY(viewer_account_id,site_id,card_id,item_id),
 FOREIGN KEY(site_id,card_id,item_id) REFERENCES media_items(site_id,card_id,item_id)
);
