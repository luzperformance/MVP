import { Database } from 'sql.js';
import { IPatientRepository } from '../../../domain/repositories/patient-repository';
import { Patient } from '../../../domain/entities/patient';
import { SQLiteConnection } from '../sqlite-connection';

export class SQLitePatientRepository implements IPatientRepository {
  private async getDb(): Promise<Database> {
    return await SQLiteConnection.getInstance();
  }

  private mapRowToPatient(data: any): Patient {
    return new Patient({
      id: data.id,
      name: data.name,
      birthDate: data.birth_date,
      phone: data.phone,
      email: data.email,
      gender: data.gender,
      occupation: data.occupation,
      mainComplaint: data.main_complaint,
      notes: data.notes,
      cpfEncrypted: data.cpf_encrypted,
      mgmtStatus: data.mgmt_status,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    });
  }

  async findById(id: string): Promise<Patient | null> {
    const db = await this.getDb();
    const result = db.exec('SELECT * FROM patients WHERE id = ?', [id]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const data: any = {};
    columns.forEach((col, idx) => {
      data[col] = row[idx];
    });

    return this.mapRowToPatient(data);
  }

  async findAll(): Promise<Patient[]> {
    const db = await this.getDb();
    const result = db.exec('SELECT * FROM patients WHERE deleted_at IS NULL');
    
    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const data: any = {};
      columns.forEach((col, idx) => {
        data[col] = row[idx];
      });
      return this.mapRowToPatient(data);
    });
  }

  async save(patient: Patient): Promise<void> {
    const db = await this.getDb();
    const json = patient.toJSON();
    db.run(
      `INSERT INTO patients (id, name, birth_date, phone, email, gender, mgmt_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [json.id, json.name, json.birthDate ?? null, json.phone ?? null, json.email ?? null, json.gender ?? null, json.mgmtStatus ?? null]
    );
    SQLiteConnection.save(db);
  }

  async update(patient: Patient): Promise<void> {
    const db = await this.getDb();
    const json = patient.toJSON();
    db.run(
      `UPDATE patients SET 
        name = ?, 
        birth_date = ?, 
        phone = ?, 
        email = ?, 
        gender = ?, 
        mgmt_status = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
      [json.name, json.birthDate ?? null, json.phone ?? null, json.email ?? null, json.gender ?? null, json.mgmtStatus ?? null, json.id]
    );
    SQLiteConnection.save(db);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    db.run("UPDATE patients SET deleted_at = datetime('now') WHERE id = ?", [id]);
    SQLiteConnection.save(db);
  }
}
