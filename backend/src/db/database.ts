import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

/* ──────────────────────────────────────────────────
   Dual-mode database: SQLite (local MVP) + PG (prod)
   Default = SQLite for zero-config local dev
   Set USE_PG=true in .env to use PostgreSQL
   ────────────────────────────────────────────────── */

const USE_PG = process.env.USE_PG === 'true';
const DB_DIR = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './data');
const DB_FILE = path.resolve(process.env.DB_PATH || './data/prontuario.db');

// ─── SQLite (default for local dev) ───
let sqliteDb: any = null;

// Wrapper for sql.js Statement to mimic better-sqlite3
class StatementWrapper {
  private stmt: any;
  constructor(stmt: any) { this.stmt = stmt; }

  bind(params: any[]) {
    this.stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
    return this;
  }

  step() {
    return this.stmt.step();
  }

  getColumnNames() {
    return this.stmt.getColumnNames();
  }

  // Raw get from sql.js (returns array)
  getRaw() {
    return this.stmt.get();
  }

  // better-sqlite3 style all() (returns array of objects)
  all(...params: any[]) {
    try {
      this.stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
      const results = [];
      while (this.stmt.step()) {
        results.push(this.stmt.getAsObject());
      }
      return results;
    } finally {
      this.stmt.reset();
    }
  }

  // better-sqlite3 style get() (returns one object)
  get(...params: any[]) {
    try {
      this.stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
      let result = null;
      if (this.stmt.step()) {
        result = this.stmt.getAsObject();
      }
      return result;
    } finally {
      this.stmt.reset();
    }
  }

  run(...params: any[]) {
    try {
      this.stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
      this.stmt.step();
      return { changes: 1 }; 
    } finally {
      this.stmt.reset();
    }
  }

  free() {
    this.stmt.free();
  }

  reset() {
    this.stmt.reset();
  }
}

// Wrapper for sql.js Database to mimic better-sqlite3
class DatabaseWrapper {
  private db: Database;
  constructor(db: Database) { this.db = db; }

  prepare(sql: string) {
    const stmt = this.db.prepare(sql);
    return new StatementWrapper(stmt);
  }

  run(sql: string, ...params: any[]) {
    this.db.run(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
    return { changes: 1 };
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  export() {
    return this.db.export();
  }
}

export function getSqliteDb(): any {
  if (!sqliteDb) throw new Error('SQLite not initialized. Call initDatabase() first.');
  return sqliteDb;
}

function saveSqliteSync() {
  if (!sqliteDb) return;
  try {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (e) {
    console.error('SQLite save error:', e);
  }
}

export function saveSqlite() { saveSqliteSync(); }

// Auto-save every 30 seconds
setInterval(saveSqliteSync, 30_000);

// ─── PostgreSQL (production — lazy loaded) ───
let _pool: any = null;

export function getPool(): any {
  if (!_pool) throw new Error('PG pool not initialized. Set USE_PG=true and call initDatabase().');
  return _pool;
}

// Export pool as a getter for compatibility with existing routes
export const pool = new Proxy({} as any, {
  get(_target, prop) {
    return getPool()[prop];
  }
});

// Compatibility alias
export const getDb = () => USE_PG ? getPool() : getSqliteDb();

// ─── Schema ───
const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS doctor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    crm TEXT,
    specialty TEXT,
    can_access_records INTEGER DEFAULT 1,
    can_edit_agenda INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    role TEXT DEFAULT 'doctor',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    birth_date TEXT,
    phone TEXT,
    email TEXT,
    gender TEXT,
    occupation TEXT,
    main_complaint TEXT,
    notes TEXT,
    cpf_encrypted TEXT,
    phone2 TEXT,
    address TEXT,
    cep TEXT,
    city TEXT,
    state TEXT,
    insurance_name TEXT,
    insurance_plan TEXT,
    first_consultation TEXT,
    last_consultation TEXT,
    next_consultation TEXT,
    last_prescription TEXT,
    last_exam TEXT,
    mgmt_status TEXT DEFAULT 'ativo',
    uses_ea INTEGER DEFAULT 0,
    wants_children INTEGER DEFAULT 0,
    observations TEXT,
    origin TEXT,
    package_type TEXT,
    monthly_value REAL,
    payment_date TEXT,
    needs_nf INTEGER DEFAULT 0,
    contract_done INTEGER DEFAULT 0,
    contract_start TEXT,
    contract_end TEXT,
    contract_notes TEXT,
    lgpd_consent_at TEXT,
    lgpd_consent_ip TEXT,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    raw_input TEXT,
    soap_subjective TEXT,
    soap_objective TEXT,
    soap_assessment TEXT,
    soap_plan TEXT,
    notes TEXT,
    content TEXT,
    consultation_date TEXT DEFAULT (date('now')),
    duration_minutes INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lab_exams (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    exam_date TEXT NOT NULL,
    lab_name TEXT,
    pdf_filename TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lab_markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT NOT NULL REFERENCES lab_exams(id) ON DELETE CASCADE,
    marker_name TEXT NOT NULL,
    marker_category TEXT,
    value REAL NOT NULL,
    unit TEXT,
    ref_min REAL,
    ref_max REAL,
    optimal_min REAL,
    optimal_max REAL,
    status TEXT DEFAULT 'normal'
  );

  CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    entry_date TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT,
    status TEXT DEFAULT 'novo',
    temperature TEXT DEFAULT 'morno',
    expected_value REAL,
    tags TEXT,
    notes TEXT,
    next_followup_at TEXT,
    converted_at TEXT,
    lost_reason TEXT,
    score REAL,
    score_reasoning TEXT,
    scored_at TEXT,
    last_activity_at TEXT,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    patient_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'ativo',
    value REAL,
    acquisition_date TEXT,
    expiration_date TEXT,
    description TEXT,
    metadata TEXT,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patient_bi_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctor(id),
    layout_data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    patient_id TEXT,
    doctor_id INTEGER,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_id TEXT,
    filename TEXT NOT NULL,
    original_name TEXT,
    category TEXT,
    description TEXT,
    taken_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS doctor (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    crm TEXT,
    specialty TEXT,
    can_access_records BOOLEAN DEFAULT TRUE,
    can_edit_agenda BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'doctor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function initDatabase() {
  if (USE_PG) {
    // Dynamic import — only loads pg when needed
    const { Pool } = await import('pg');
    const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prontuario';
    _pool = new Pool({ connectionString, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });

    try {
      const client = await _pool.connect();
      console.log('🐘 PostgreSQL connected (Production Mode)');
      await client.query(PG_SCHEMA);
      client.release();
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL', err);
      throw err;
    }
  } else {
    // SQLite mode — zero config
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      sqliteDb = new DatabaseWrapper(new SQL.Database(fileBuffer));
      console.log('📦 SQLite loaded from', DB_FILE);
    } else {
      sqliteDb = new DatabaseWrapper(new SQL.Database());
      console.log('📦 SQLite created (new database)');
    }

    sqliteDb.run(SQLITE_SCHEMA);

    // Dynamic Migrations (Handle missing columns)
    try {
      // Add is_admin to doctor if missing
      sqliteDb.run("ALTER TABLE doctor ADD COLUMN is_admin INTEGER DEFAULT 0");
      console.log('✨ Migrated: doctor.is_admin added');
    } catch (e) { /* already exists */ }

    saveSqliteSync();
    console.log('✅ SQLite initialized (Zero-Config MVP Mode)');
  }
}
