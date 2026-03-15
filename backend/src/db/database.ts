import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { logger } from '../services/logger';

let sqlDb: SqlJsDatabase;
let dbPath: string;

// Auto-save interval (every 5 seconds if dirty)
let dirty = false;
let saveInterval: ReturnType<typeof setInterval>;

function saveToDisk() {
  if (!dirty || !sqlDb) return;
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  dirty = false;
}

// === Wrapper that mimics better-sqlite3 API ===
// All routes use: db.prepare(sql).get(p), .all(p), .run(p), db.exec(sql)

interface PreparedStatement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes: number; lastInsertRowid: number };
}

class DbWrapper {
  constructor(private db: SqlJsDatabase) {}

  prepare(sql: string): PreparedStatement {
    const database = this.db;
    return {
      get(...params: any[]): any {
        const stmt = database.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result;
        }
        stmt.free();
        return undefined;
      },
      all(...params: any[]): any[] {
        const results: any[] = [];
        const stmt = database.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      run(...params: any[]): { changes: number; lastInsertRowid: number } {
        if (params.length > 0) {
          database.run(sql, params);
        } else {
          database.run(sql);
        }
        dirty = true;
        const changesStmt = database.prepare('SELECT changes() as c, last_insert_rowid() as r');
        changesStmt.step();
        const info = changesStmt.getAsObject() as any;
        changesStmt.free();
        return { changes: info.c, lastInsertRowid: info.r };
      },
    };
  }

  exec(sql: string): void {
    this.db.exec(sql);
    dirty = true;
  }

  transaction<T>(fn: (items: any[]) => void) {
    return (items: any[]) => {
      this.db.run('BEGIN TRANSACTION');
      try {
        fn(items);
        this.db.run('COMMIT');
        dirty = true;
      } catch (e) {
        this.db.run('ROLLBACK');
        throw e;
      }
    };
  }

  pragma(pragma: string): void {
    this.db.run(`PRAGMA ${pragma}`);
  }
}

let wrapper: DbWrapper;

export function getDb(): DbWrapper {
  if (!wrapper) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return wrapper;
}

export async function initDatabase(): Promise<void> {
  dbPath = path.resolve(process.env.DB_PATH || './data/prontuario.db');
  const dbDir = path.dirname(dbPath);

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
    logger.info(`📂 Banco SQLite carregado: ${dbPath}`);
  } else {
    sqlDb = new SQL.Database();
    logger.info(`📂 Novo banco SQLite criado: ${dbPath}`);
  }

  wrapper = new DbWrapper(sqlDb);

  // Enable WAL mode and foreign keys
  wrapper.pragma('foreign_keys = ON');

  // Run migrations
  await runMigrations();

  // Save to disk
  saveToDisk();

  // Auto-save every 5 seconds
  saveInterval = setInterval(saveToDisk, 5000);

  // Save on exit
  process.on('SIGINT', () => { saveToDisk(); process.exit(0); });
  process.on('SIGTERM', () => { saveToDisk(); process.exit(0); });

  logger.info('✅ Banco de dados pronto.');
}

async function runMigrations(): Promise<void> {
  // Create migrations tracking table
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const ran = wrapper.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  const ranNames = new Set(ran.map(r => r.name));

  for (const file of files) {
    if (ranNames.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info(`  Running migration: ${file}`);

    wrapper.exec(sql);
    wrapper.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
  }

  saveToDisk();
}
