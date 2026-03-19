import fs from 'fs';
import initSqlJs from 'sql.js';

async function main() {
  const SQL = await initSqlJs();
  const dbPath = './data/prontuario.db';
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  const pragma = db.exec('PRAGMA table_info(doctor);');
  const cols = (pragma[0]?.values ?? []).map((row: any[]) => String(row[1]));

  const maybeAdd = (name: string, sql: string) => {
    if (!cols.includes(name)) {
      db.exec(sql);
      console.log(`added column: ${name}`);
    }
  };

  maybeAdd('can_access_records', 'ALTER TABLE doctor ADD COLUMN can_access_records INTEGER DEFAULT 1');
  maybeAdd('can_edit_agenda', 'ALTER TABLE doctor ADD COLUMN can_edit_agenda INTEGER DEFAULT 1');
  maybeAdd('is_admin', 'ALTER TABLE doctor ADD COLUMN is_admin INTEGER DEFAULT 0');

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log('sqlite schema patched');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
