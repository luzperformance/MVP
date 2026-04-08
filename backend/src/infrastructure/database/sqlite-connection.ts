import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

export class SQLiteConnection {
  private static instance: Database | null = null;
  private static readonly DB_FILE = path.resolve(process.env.DB_PATH || './data/prontuario.db');

  public static async getInstance(): Promise<Database> {
    if (!this.instance) {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.DB_FILE)) {
        const fileBuffer = fs.readFileSync(this.DB_FILE);
        this.instance = new SQL.Database(fileBuffer);
      } else {
        const dbDir = path.dirname(this.DB_FILE);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        this.instance = new SQL.Database();
      }
    }
    return this.instance;
  }

  public static save(db: Database): void {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.DB_FILE, buffer);
    } catch (e) {
      console.error('SQLite save error:', e);
    }
  }
}
