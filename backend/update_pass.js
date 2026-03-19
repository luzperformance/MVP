const init = async () => {
  const sqlite3 = require('sqlite3').verbose();
  const bcrypt = require('bcryptjs');
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const email = 'luzardi18@gmail.com';
  const password = 'Lopes@93';
  const hash = await bcrypt.hash(password, 12);

  db.serialize(() => {
    db.get('SELECT id FROM doctor WHERE email = ?', [email], (err, row) => {
      if (row) {
        db.run('UPDATE doctor SET password_hash = ?, is_admin = 1, can_access_records = 1, can_edit_agenda = 1 WHERE email = ?', [hash, email], (err) => {
          if (err) console.error('Erro ao atualizar:', err);
          else console.log('✅ Senha de luzardi18@gmail.com atualizada para Lopes@93.');
        });
      } else {
        db.run('INSERT INTO doctor (email, password_hash, name, crm, is_admin, can_access_records, can_edit_agenda) VALUES (?, ?, ?, ?, 1, 1, 1)', 
          [email, hash, 'Dr. Luzardi', 'CRM/SP 123456'], (err) => {
            if (err) console.error('Erro ao inserir:', err);
            else console.log('✅ Usuário luzardi18@gmail.com criado com senha Lopes@93.');
          });
      }
    });
  });
};

init();
