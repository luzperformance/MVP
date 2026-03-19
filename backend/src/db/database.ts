import initSqlJs, { Database } from 'sql.js';
import { Pool } from 'pg';
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
let sqliteDb: Database | null = null;

export function getSqliteDb(): Database {
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

// ─── PostgreSQL (production) ───
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prontuario';

export const pool = USE_PG
  ? new Pool({ connectionString, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 })
  : null as unknown as Pool; // Stub when not using PG

// Compatibility alias
export const getDb = () => USE_PG ? pool : getSqliteDb();

// ─── Schema ───
const SCHEMA_SQL = `
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
`;

const PG_SCHEMA_SQL = `
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
    try {
      const client = await pool.connect();
      console.log('🐘 PostgreSQL connected (Production Mode)');
      await client.query(PG_SCHEMA_SQL);
      client.release();
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL', err);
      throw err;
    }
  } else {
    // SQLite mode
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log('📦 SQLite loaded from', DB_FILE);
    } else {
      sqliteDb = new SQL.Database();
      console.log('📦 SQLite created (new database)');
    }

    sqliteDb.run(SCHEMA_SQL);
    saveSqliteSync();
    console.log('✅ SQLite initialized (Zero-Config MVP Mode)');
  }
}
