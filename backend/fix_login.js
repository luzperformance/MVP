const init = async () => {
  const sqlite3 = require('sqlite3').verbose();
  const bcrypt = require('bcryptjs');
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const email = 'luzardi18@gmail.com';
  const password = '1234';
  const hash = await bcrypt.hash(password, 12);

  db.serialize(() => {
    // Garantir que a tabela existe (caso não tenha sido criada)
    db.run(`CREATE TABLE IF NOT EXISTS doctor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      crm TEXT,
      can_access_records INTEGER DEFAULT 0,
      can_edit_agenda INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      role TEXT DEFAULT 'doctor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inserir ou atualizar o usuário
    db.get('SELECT id FROM doctor WHERE email = ?', [email], (err, row) => {
      if (row) {
        db.run('UPDATE doctor SET password_hash = ?, is_admin = 1, can_access_records = 1, can_edit_agenda = 1 WHERE email = ?', [hash, email], (err) => {
          if (err) console.error('Erro ao atualizar:', err);
          else console.log('✅ Usuário luzardi18@gmail.com atualizado com sucesso (senha 1234 e permissões FULL).');
        });
      } else {
        db.run('INSERT INTO doctor (email, password_hash, name, crm, is_admin, can_access_records, can_edit_agenda) VALUES (?, ?, ?, ?, 1, 1, 1)', 
          [email, hash, 'Dr. Luzardi', 'CRM/SP 123456'], (err) => {
            if (err) console.error('Erro ao inserir:', err);
            else console.log('✅ Usuário luzardi18@gmail.com criado com sucesso (senha 1234 e permissões FULL).');
          });
      }
    });

    // Audit Log table just in case
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        entity TEXT,
        ip TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
};

init();
