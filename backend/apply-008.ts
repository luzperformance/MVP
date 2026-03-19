import { initDatabase, getDb } from './src/db/database';
import fs from 'fs';
import path from 'path';

async function main() {
  await initDatabase();
  const db = getDb();
  
  try {
    const sqlPath = path.join(__dirname, 'src', 'db', 'migrations', '008_bi_dashboard.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQLite doesn't error usually with IF NOT EXISTS, we can just run
    db.exec(sql);
    console.log("-> 008_bi_dashboard applied: patient_bi_layouts table created.");
  } catch (err) {
    console.error("Error applying migration 008:", err);
  }

  console.log("Waiting 3 seconds for Database Auto-save...");
  await new Promise(r => setTimeout(r, 3000));
  console.log("Database saved.");
  process.exit(0);
}

main();
