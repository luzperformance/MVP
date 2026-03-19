const initSqlJs = require('sql.js');
const fs = require('fs');

async function main() {
  try {
    const SQL = await initSqlJs();
    const dbPath = 'data/prontuario.db';
    let dbData;
    try {
      dbData = fs.readFileSync(dbPath);
    } catch(e) {
      console.log('Database not found at ' + dbPath);
      return;
    }
    const db = new SQL.Database(dbData);
    
    // Check if the user even exits
    let res = db.exec("SELECT id, email, name, can_access_records, can_edit_agenda FROM doctor");
    console.log("BEFORE:", JSON.stringify(res, null, 2));

    // Update
    db.run("UPDATE doctor SET can_access_records = 1, can_edit_agenda = 1 WHERE email = 'luzardi18@gmail.com' OR email = 'luzardi18@gmail.com ' OR id = 1;");
    
    // Log new state
    res = db.exec("SELECT id, email, name, can_access_records, can_edit_agenda FROM doctor");
    console.log("AFTER:", JSON.stringify(res, null, 2));

    const buffer = Buffer.from(db.export());
    fs.writeFileSync(dbPath, buffer);
    console.log("MIGRATION APPLIED DIRCTLY TO pruntuario.db");
  } catch (err) {
    console.error(err);
  }
}
main();
