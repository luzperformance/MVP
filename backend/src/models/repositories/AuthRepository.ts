import { pool, getSqliteDb, saveSqlite } from './Database';
import { DoctorEntity } from '../entities/Doctor';

const USE_PG = process.env.USE_PG === 'true';

export class AuthRepository {
  async findByEmail(email: string): Promise<DoctorEntity | null> {
    if (USE_PG) {
      const { rows } = await pool.query('SELECT * FROM doctor WHERE email = $1', [email]);
      return rows[0] || null;
    } else {
      const db = getSqliteDb();
      const doctor = db.prepare('SELECT * FROM doctor WHERE email = ?').get(email);
      return (doctor as DoctorEntity) || null;
    }
  }

  async create(data: Partial<DoctorEntity>): Promise<void> {
    const { email, password_hash, name, crm } = data;
    if (USE_PG) {
      await pool.query(
        'INSERT INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin) VALUES ($1, $2, $3, $4, TRUE, TRUE, TRUE) ON CONFLICT (email) DO NOTHING',
        [email, password_hash, name, crm]
      );
    } else {
      const db = getSqliteDb();
      db.run(
        'INSERT OR IGNORE INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin) VALUES (?, ?, ?, ?, 1, 1, 1)',
        [email, password_hash, name, crm]
      );
      saveSqlite();
    }
  }
}
