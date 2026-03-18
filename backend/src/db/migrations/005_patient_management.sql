-- 005_patient_management.sql — Campos de gestão para secretária
-- Endereço
ALTER TABLE patients ADD COLUMN phone2 TEXT;
ALTER TABLE patients ADD COLUMN address TEXT;
ALTER TABLE patients ADD COLUMN cep TEXT;
ALTER TABLE patients ADD COLUMN city TEXT;
ALTER TABLE patients ADD COLUMN state TEXT;

-- Convênio
ALTER TABLE patients ADD COLUMN insurance_name TEXT;
ALTER TABLE patients ADD COLUMN insurance_plan TEXT;

-- Consultas
ALTER TABLE patients ADD COLUMN first_consultation DATE;
ALTER TABLE patients ADD COLUMN last_consultation DATE;
ALTER TABLE patients ADD COLUMN next_consultation DATE;
ALTER TABLE patients ADD COLUMN last_prescription DATE;
ALTER TABLE patients ADD COLUMN last_exam DATE;

-- Status gerencial
ALTER TABLE patients ADD COLUMN mgmt_status TEXT CHECK(mgmt_status IN ('ativo', 'inativo')) DEFAULT 'ativo';

-- Histórico clínico relevante
ALTER TABLE patients ADD COLUMN uses_ea INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN wants_children INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN observations TEXT;

-- Origem / canal de aquisição
ALTER TABLE patients ADD COLUMN origin TEXT;

-- Contrato / financeiro
ALTER TABLE patients ADD COLUMN package_type TEXT CHECK(package_type IN ('mensal', 'trimestral', 'semestral', 'anual'));
ALTER TABLE patients ADD COLUMN monthly_value REAL;
ALTER TABLE patients ADD COLUMN payment_date DATE;
ALTER TABLE patients ADD COLUMN needs_nf INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN contract_done INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN contract_start DATE;
ALTER TABLE patients ADD COLUMN contract_end DATE;
ALTER TABLE patients ADD COLUMN contract_notes TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(mgmt_status);
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city);
CREATE INDEX IF NOT EXISTS idx_patients_package ON patients(package_type);
CREATE INDEX IF NOT EXISTS idx_patients_next_consult ON patients(next_consultation);
