-- 001_init.sql — Schema inicial do Prontuário LuzPerformance
-- LGPD-compliant: soft deletes, audit log, consentimento registrado

-- Configuração do médico (single-user)
CREATE TABLE IF NOT EXISTS doctor (
  id INTEGER PRIMARY KEY DEFAULT 1,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  crm TEXT NOT NULL,
  specialty TEXT DEFAULT 'Medicina do Esporte e Performance',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pacientes
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  cpf_encrypted TEXT,                      -- LGPD: armazenado criptografado
  phone TEXT,
  email TEXT,
  gender TEXT CHECK(gender IN ('M', 'F', 'outro', NULL)),
  occupation TEXT,
  main_complaint TEXT,
  notes TEXT,
  lgpd_consent_at DATETIME,               -- LGPD: timestamp do consentimento
  lgpd_consent_ip TEXT,                   -- LGPD: IP do consentimento
  lgpd_consent_version TEXT DEFAULT '1.0',
  deleted_at DATETIME,                     -- Soft delete (LGPD: direito ao esquecimento)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anamneses / Prontuário (uma por consulta)
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('consulta', 'retorno', 'exame', 'procedimento', 'teleconsulta')),
  source TEXT NOT NULL CHECK(source IN ('manual', 'transcricao', 'resumo')),
  raw_input TEXT,                          -- Transcrição bruta do Google Meet
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  notes TEXT,
  consultation_date DATE NOT NULL,
  duration_minutes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fotos de evolução
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_id TEXT REFERENCES records(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  category TEXT CHECK(category IN ('antes', 'durante', 'depois', 'evolucao', 'exame', 'outro')),
  description TEXT,
  taken_at DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exames laboratoriais (conjunto de exame)
CREATE TABLE IF NOT EXISTS lab_exams (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  lab_name TEXT,
  pdf_filename TEXT,                        -- PDF original no filesystem
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Marcadores individuais do exame (cada valor numérico)
CREATE TABLE IF NOT EXISTS lab_markers (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES lab_exams(id) ON DELETE CASCADE,
  marker_name TEXT NOT NULL,               -- ex: "Testosterona Total"
  marker_category TEXT,                    -- ex: "Hormônios", "Metabólico", "Tireóide"
  value REAL NOT NULL,
  unit TEXT NOT NULL,                      -- ex: "ng/dL"
  ref_min REAL,                            -- referência mínima do laboratório
  ref_max REAL,                            -- referência máxima do laboratório
  optimal_min REAL,                        -- faixa ótima (Dr. Vinícius)
  optimal_max REAL,
  status TEXT DEFAULT 'normal',             -- calculado pela aplicação (baixo/alto/subotimo/acima_otimo/normal)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log LGPD — todo acesso a dados pessoais fica registrado
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL CHECK(action IN ('READ', 'WRITE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT')),
  entity TEXT NOT NULL,
  entity_id TEXT,
  patient_id TEXT,
  details TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- === ÍNDICES ===
CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

CREATE INDEX IF NOT EXISTS idx_records_patient ON records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON records(consultation_date);

CREATE INDEX IF NOT EXISTS idx_photos_patient ON photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_photos_record ON photos(record_id);

CREATE INDEX IF NOT EXISTS idx_lab_exams_patient ON lab_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_exams_date ON lab_exams(exam_date);

CREATE INDEX IF NOT EXISTS idx_lab_markers_exam ON lab_markers(exam_id);
CREATE INDEX IF NOT EXISTS idx_lab_markers_name ON lab_markers(marker_name);

CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- Trigger: update updated_at em patients
CREATE TRIGGER IF NOT EXISTS patients_updated_at
  AFTER UPDATE ON patients
  BEGIN
    UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Trigger: update updated_at em records
CREATE TRIGGER IF NOT EXISTS records_updated_at
  AFTER UPDATE ON records
  BEGIN
    UPDATE records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
