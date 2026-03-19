import { initDatabase, getDb } from './src/db/database';

async function main() {
  await initDatabase();
  const db = getDb();
  console.table(db.prepare('SELECT id, email, name, crm FROM doctor').all());
  process.exit();
}
main();
