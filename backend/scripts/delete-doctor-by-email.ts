import fs from 'fs';
import initSqlJs from 'sql.js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Uso: npx tsx scripts/delete-doctor-by-email.ts <email>');
  }

  const dbPath = './data/prontuario.db';
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  const before = db.exec(`SELECT COUNT(*) as c FROM doctor WHERE email='${email.replace(/'/g, "''")}'`);
  const beforeCount = Number(before[0]?.values?.[0]?.[0] ?? 0);

  db.run('DELETE FROM doctor WHERE email = ?', [email]);

  const after = db.exec(`SELECT COUNT(*) as c FROM doctor WHERE email='${email.replace(/'/g, "''")}'`);
  const afterCount = Number(after[0]?.values?.[0]?.[0] ?? 0);

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log(JSON.stringify({ email, deleted: beforeCount - afterCount, remaining: afterCount }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
