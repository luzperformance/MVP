import { initDatabase, getDb } from './src/db/database';
import fs from 'fs';

async function main() {
  await initDatabase();
  const db = getDb();
  
  const users = db.prepare('SELECT id, email, name, can_access_records, can_edit_agenda FROM doctor').all();
  fs.writeFileSync('users_check.json', JSON.stringify(users, null, 2));
  
  process.exit(0);
}

main();
