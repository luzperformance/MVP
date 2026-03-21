-- Campanhas de anúncios (manual, v1 — sem integração Ads API)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'outro',
  budget_monthly REAL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  notes TEXT,
  deleted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
