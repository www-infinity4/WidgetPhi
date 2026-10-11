-- WidgetPhi hosted multi-tenant D1 schema.
-- Create ONE database for the platform; tenants/sites have logically isolated rows.
-- All private reads and writes must filter owner_sub from verified server auth.
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  owner_sub TEXT NOT NULL,
  title TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0 CHECK(is_published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS sites_by_owner ON sites(owner_sub, created_at);

CREATE TABLE IF NOT EXISTS site_cards (
  site_id TEXT NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  settings_json TEXT NOT NULL CHECK(json_valid(settings_json)),
  public_enabled INTEGER NOT NULL DEFAULT 0 CHECK(public_enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, instance_id)
);
CREATE INDEX IF NOT EXISTS cards_by_template ON site_cards(template_id, site_id);

CREATE TABLE IF NOT EXISTS card_content (
  content_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  index_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(index_json)),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (site_id, instance_id) REFERENCES site_cards(site_id, instance_id) ON DELETE CASCADE,
  UNIQUE (site_id, instance_id, source_key)
);
CREATE INDEX IF NOT EXISTS content_by_card ON card_content(site_id, instance_id, visibility, created_at);

-- Events are telemetry receipts ONLY, not money. Never credit wallet from untrusted events.
CREATE TABLE IF NOT EXISTS card_events (
  site_id TEXT NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('search','open','collect-request','share-request','story-created')),
  source_key TEXT NOT NULL DEFAULT '',
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, event_id),
  FOREIGN KEY (site_id, instance_id) REFERENCES site_cards(site_id, instance_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS events_by_card ON card_events(site_id, instance_id, recorded_at);
