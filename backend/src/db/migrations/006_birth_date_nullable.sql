-- 006_birth_date_nullable.sql — Permitir pacientes sem data de nascimento
-- SQLite não suporta ALTER COLUMN, então recriamos a tabela

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS patients_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  cpf_encrypted TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT CHECK(gender IN ('M', 'F', 'outro', NULL)),
  occupation TEXT,
  main_complaint TEXT,
  notes TEXT,
  lgpd_consent_at DATETIME,
  lgpd_consent_ip TEXT,
  lgpd_consent_version TEXT DEFAULT '1.0',
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  phone2 TEXT,
  address TEXT,
  cep TEXT,
  city TEXT,
  state TEXT,
  insurance_name TEXT,
  insurance_plan TEXT,
  first_consultation DATE,
  last_consultation DATE,
  next_consultation DATE,
  last_prescription DATE,
  last_exam DATE,
  mgmt_status TEXT CHECK(mgmt_status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  uses_ea INTEGER DEFAULT 0,
  wants_children INTEGER DEFAULT 0,
  observations TEXT,
  origin TEXT,
  package_type TEXT CHECK(package_type IN ('mensal', 'trimestral', 'semestral', 'anual')),
  monthly_value REAL,
  payment_date DATE,
  needs_nf INTEGER DEFAULT 0,
  contract_done INTEGER DEFAULT 0,
  contract_start DATE,
  contract_end DATE,
  contract_notes TEXT
);

INSERT INTO patients_new SELECT
  id, name, birth_date, cpf_encrypted, phone, email, gender, occupation,
  main_complaint, notes, lgpd_consent_at, lgpd_consent_ip, lgpd_consent_version,
  deleted_at, created_at, updated_at,
  phone2, address, cep, city, state, insurance_name, insurance_plan,
  first_consultation, last_consultation, next_consultation, last_prescription, last_exam,
  mgmt_status, uses_ea, wants_children, observations, origin,
  package_type, monthly_value, payment_date, needs_nf, contract_done,
  contract_start, contract_end, contract_notes
FROM patients;

DROP TABLE patients;

ALTER TABLE patients_new RENAME TO patients;

CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(mgmt_status);
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city);
CREATE INDEX IF NOT EXISTS idx_patients_package ON patients(package_type);
CREATE INDEX IF NOT EXISTS idx_patients_next_consult ON patients(next_consultation);

CREATE TRIGGER IF NOT EXISTS patients_updated_at
  AFTER UPDATE ON patients
  BEGIN
    UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

PRAGMA foreign_keys=ON;
