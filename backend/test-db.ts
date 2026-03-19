import { initDatabase, getDb } from './src/db/database';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    await initDatabase();
    const db = getDb();
    const migrations = db.prepare('SELECT * FROM _migrations').all();
    console.log('Applied Migrations:');
    console.table(migrations);
    process.exit(0);
  } catch (err) {
    console.error('Error checking migrations:', err);
    process.exit(1);
  }
}
main();
