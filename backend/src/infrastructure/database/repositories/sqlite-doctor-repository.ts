import { Database } from 'sql.js';
import { IDoctorRepository } from '../../../../domain/repositories/doctor-repository';
import { Doctor } from '../../../../domain/entities/doctor';
import { SQLiteConnection } from '../sqlite-connection';

export class SQLiteDoctorRepository implements IDoctorRepository {
  private async getDb(): Promise<Database> {
    return await SQLiteConnection.getInstance();
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    const db = await this.getDb();
    const result = db.exec('SELECT * FROM doctor WHERE email = ?', [email]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const data: any = {};
    columns.forEach((col, idx) => {
      data[col] = row[idx];
    });

    return new Doctor({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      crm: data.crm,
      specialty: data.specialty,
      canAccessRecords: data.can_access_records === 1,
      canEditAgenda: data.can_edit_agenda === 1,
      isAdmin: data.is_admin === 1,
      role: data.role,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
    });
  }

  async findById(id: number): Promise<Doctor | null> {
    const db = await this.getDb();
    const result = db.exec('SELECT * FROM doctor WHERE id = ?', [id]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const data: any = {};
    columns.forEach((col, idx) => {
      data[col] = row[idx];
    });

    return new Doctor({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      crm: data.crm,
      specialty: data.specialty,
      canAccessRecords: data.can_access_records === 1,
      canEditAgenda: data.can_edit_agenda === 1,
      isAdmin: data.is_admin === 1,
      role: data.role,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
    });
  }

  async save(doctor: Doctor): Promise<void> {
    const db = await this.getDb();
    db.run(
      `INSERT INTO doctor (email, password_hash, name, crm, specialty, can_access_records, can_edit_agenda, is_admin, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor.email,
        doctor.passwordHash,
        doctor.name,
        doctor.crm,
        doctor.specialty,
        doctor.canAccessRecords ? 1 : 0,
        doctor.canEditAgenda ? 1 : 0,
        doctor.isAdmin ? 1 : 0,
        doctor.role
      ]
    );
    SQLiteConnection.save(db);
  }

  async update(doctor: Doctor): Promise<void> {
    const db = await this.getDb();
    db.run(
      `UPDATE doctor SET 
        email = ?, 
        password_hash = ?, 
        name = ?, 
        crm = ?, 
        specialty = ?, 
        can_access_records = ?, 
        can_edit_agenda = ?, 
        is_admin = ?, 
        role = ? 
       WHERE id = ?`,
      [
        doctor.email,
        doctor.passwordHash,
        doctor.name,
        doctor.crm,
        doctor.specialty,
        doctor.canAccessRecords ? 1 : 0,
        doctor.canEditAgenda ? 1 : 0,
        doctor.isAdmin ? 1 : 0,
        doctor.role,
        doctor.id
      ]
    );
    SQLiteConnection.save(db);
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    db.run('DELETE FROM doctor WHERE id = ?', [id]);
    SQLiteConnection.save(db);
  }
}
