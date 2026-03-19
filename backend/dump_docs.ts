import { initDatabase, getDb } from './src/db/database';
import fs from 'fs';

async function main() {
  await initDatabase();
  const db = getDb();
  const docs = db.prepare('SELECT id, email, name FROM doctor').all();
  fs.writeFileSync('doctors.json', JSON.stringify(docs, null, 2));
  process.exit();
}
main();
