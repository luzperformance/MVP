import fs from 'fs';
import initSqlJs from 'sql.js';

async function main() {
  const email = 'almeidadanigomes@gmail.com';
  const dbPath = './data/prontuario.db';
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  db.run(
    `UPDATE doctor
       SET name = ?, crm = ?, can_access_records = 0, can_edit_agenda = 1, is_admin = 1
     WHERE email = ?`,
    ['Dani Gomes Almeida (Secretária)', 'N/A', email]
  );

  const rows = db.exec(
    `SELECT email, name, crm, can_access_records, can_edit_agenda, is_admin
       FROM doctor
      WHERE email = '${email.replace(/'/g, "''")}'`
  );

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log(JSON.stringify(rows[0]?.values?.[0] ?? null));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
