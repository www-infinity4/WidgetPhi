-- Reusable WidgetPhi card library; additive to widgetphi-catalog D1.
-- Use owner-sub verified by the existing trusted Phi wallet session.
CREATE TABLE IF NOT EXISTS phi_card_templates (
 template_id TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 category TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 source_repo TEXT NOT NULL,
 source_path TEXT NOT NULL DEFAULT '',
 readiness TEXT NOT NULL CHECK(readiness IN ('existing','integration','template','candidate')),
 settings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(settings_json)),
 keywords_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(keywords_json)),
 foundation_creator_sub TEXT,
 attribution_state TEXT NOT NULL DEFAULT 'unverified' CHECK(attribution_state IN ('unverified','wallet_verified')),
 version INTEGER NOT NULL DEFAULT 1,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_phi_templates_category ON phi_card_templates(category,readiness,active);

-- Immutable creator lineage, independent of changing names/theme/media.
-- This is derived from the actual owner of a site; never from public input.
CREATE TABLE IF NOT EXISTS phi_card_lineage (
 site_id TEXT NOT NULL,
 instance_id TEXT NOT NULL,
 template_id TEXT NOT NULL REFERENCES phi_card_templates(template_id),
 original_template_id TEXT NOT NULL REFERENCES phi_card_templates(template_id),
 derivative_parent_site_id TEXT,
 derivative_parent_instance_id TEXT,
 direct_creator_sub TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,instance_id),
 FOREIGN KEY(site_id,instance_id) REFERENCES site_cards(site_id,instance_id)
);

-- Usage evidence is not a paid StarCoin receipt. Never credit from this table.
CREATE TABLE IF NOT EXISTS phi_card_usage_evidence (
 usage_id TEXT PRIMARY KEY,
 site_id TEXT NOT NULL,
 instance_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('media_completed','song_completed','story_completed','card_used')),
 completion_source TEXT NOT NULL CHECK(completion_source IN ('player_event','provider_receipt','server_observation')),
 verification_state TEXT NOT NULL DEFAULT 'pending' CHECK(verification_state IN ('pending','verified','rejected')),
 occurred_at INTEGER NOT NULL,
 FOREIGN KEY(site_id,instance_id) REFERENCES phi_card_lineage(site_id,instance_id)
);
CREATE INDEX IF NOT EXISTS idx_phi_card_usage ON phi_card_usage_evidence(site_id,instance_id,occurred_at DESC);

-- Proposed royalties are integer tenths of StarCoin; never wallet money.
-- Two separate 0.1 rewards need two confirmed funding allocations.
-- The real StarQuest double-entry ledger owns the financial settlement.
CREATE TABLE IF NOT EXISTS phi_creator_royalty_intents (
 usage_id TEXT NOT NULL REFERENCES phi_card_usage_evidence(usage_id),
 beneficiary_role TEXT NOT NULL CHECK(beneficiary_role IN ('foundation','derivative')),
 beneficiary_creator_sub TEXT NOT NULL,
 amount_tenths INTEGER NOT NULL CHECK(amount_tenths BETWEEN 1 AND 1000),
 funding_reference TEXT,
 settlement_state TEXT NOT NULL DEFAULT 'awaiting_funding'
 CHECK(settlement_state IN ('awaiting_funding','funding_verified','settled','cancelled')),
 external_starquest_receipt_id TEXT UNIQUE,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(usage_id,beneficiary_role)
);
CREATE INDEX IF NOT EXISTS idx_phi_creator_royalties ON phi_creator_royalty_intents(beneficiary_creator_sub,settlement_state);
