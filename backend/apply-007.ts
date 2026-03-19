import { initDatabase, getDb } from './src/db/database';

async function main() {
  await initDatabase();
  const db = getDb();
  
  try {
    db.prepare(`ALTER TABLE doctor ADD COLUMN can_access_records INTEGER DEFAULT 0;`).run();
    console.log("-> Added can_access_records");
  } catch (err) {
    if ((err as Error).message.includes('duplicate column')) {
      console.log('Column can_access_records already exists.');
    } else {
      console.error(err);
    }
  }

  try {
    db.prepare(`ALTER TABLE doctor ADD COLUMN can_edit_agenda INTEGER DEFAULT 0;`).run();
    console.log("-> Added can_edit_agenda");
  } catch (err) {
    if ((err as Error).message.includes('duplicate column')) {
      console.log('Column can_edit_agenda already exists.');
    } else {
      console.error(err);
    }
  }

  db.prepare(`UPDATE doctor SET can_access_records = 1, can_edit_agenda = 1 WHERE email = 'luzardi18@gmail.com' OR id = 1;`).run();
  console.log("-> Updated luzardi18@gmail.com with permissions.");

  console.log("Waiting 6 seconds for Database Auto-save...");
  await new Promise(r => setTimeout(r, 6000));
  console.log("Database saved.");
  process.exit(0);
}

main();
