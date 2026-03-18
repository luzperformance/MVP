import fs from 'fs';
import path from 'path';
import { initDatabase, getDb } from './src/db/database';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    await initDatabase();
    const db = getDb();
    const migrationPath = path.resolve(__dirname, 'src/db/migrations/006_birth_date_nullable.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration 006...');
    db.run(sql);
    
    // Track the migration
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run('006_birth_date_nullable.sql');
    
    console.log('Migration 006 applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  }
}
main();
