-- 003_crm.sql — Módulo CRM: Leads, Atividades e Ativos

-- Leads (funil de vendas)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT CHECK(source IN ('indicacao', 'instagram', 'google', 'site', 'evento', 'outro')),
  status TEXT NOT NULL CHECK(status IN ('novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido')) DEFAULT 'novo',
  temperature TEXT CHECK(temperature IN ('frio', 'morno', 'quente')) DEFAULT 'morno',
  expected_value REAL,
  tags TEXT,
  notes TEXT,
  next_followup_at DATETIME,
  converted_at DATETIME,
  lost_reason TEXT,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Atividades do lead (timeline de interações)
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('nota', 'ligacao', 'email', 'whatsapp', 'reuniao', 'proposta', 'outro')),
  description TEXT NOT NULL,
  scheduled_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ativos (equipamentos, protocolos, contratos, etc.)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('equipamento', 'protocolo', 'suplemento', 'contrato', 'documento', 'outro')),
  status TEXT NOT NULL CHECK(status IN ('ativo', 'inativo', 'vendido', 'expirado')) DEFAULT 'ativo',
  value REAL,
  acquisition_date DATE,
  expiration_date DATE,
  description TEXT,
  metadata TEXT,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- === ÍNDICES ===
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_patient ON leads(patient_id);
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads(next_followup_at);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

CREATE INDEX IF NOT EXISTS idx_assets_lead ON assets(lead_id);
CREATE INDEX IF NOT EXISTS idx_assets_patient ON assets(patient_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_deleted ON assets(deleted_at);

-- === TRIGGERS ===
CREATE TRIGGER IF NOT EXISTS leads_updated_at
  AFTER UPDATE ON leads
  BEGIN
    UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS assets_updated_at
  AFTER UPDATE ON assets
  BEGIN
    UPDATE assets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
