-- 004_crm_scoring.sql — Lead scoring, data hygiene columns

ALTER TABLE leads ADD COLUMN score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN score_reasoning TEXT;
ALTER TABLE leads ADD COLUMN scored_at DATETIME;
ALTER TABLE leads ADD COLUMN last_activity_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at);

-- Auto-activity type for system-generated events
-- (existing CHECK constraint allows 'outro' which we'll use for system activities)
