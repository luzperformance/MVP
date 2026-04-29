import { getDb } from './Database';
import { PatientEntity } from '../entities/Patient';

export class PatientRepository {
  db = getDb();

  async findAll(query?: string): Promise<PatientEntity[]> {
    const q = query
      ? this.db.prepare(`SELECT id, name, birth_date, phone, email, gender, created_at
                        FROM patients WHERE deleted_at IS NULL AND name LIKE ?
                        ORDER BY name LIMIT 100`).all(`%${query}%`)
      : this.db.prepare(`SELECT id, name, birth_date, phone, email, gender, created_at
                        FROM patients WHERE deleted_at IS NULL ORDER BY name LIMIT 100`).all();
    return q as PatientEntity[];
  }

  async findById(id: string): Promise<PatientEntity | null> {
    const patient = this.db.prepare(
      'SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL'
    ).get(id);
    return (patient as PatientEntity) || null;
  }

  async create(data: Partial<PatientEntity>): Promise<PatientEntity> {
    const { id, name, birth_date, cpf_encrypted, phone, email, gender, occupation,
            main_complaint, notes, lgpd_consent_at, lgpd_consent_ip, mgmt_data } = data as any;
    
    this.db.prepare(`
      INSERT INTO patients (id, name, birth_date, cpf_encrypted, phone, email,
        gender, occupation, main_complaint, notes, lgpd_consent_at, lgpd_consent_ip, mgmt_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, birth_date, cpf_encrypted || null, phone || null, email || null,
           gender || null, occupation || null, main_complaint || null, notes || null,
           lgpd_consent_at || null, lgpd_consent_ip || null, JSON.stringify(mgmt_data));

    return this.findById(id!) as Promise<PatientEntity>;
  }

  async update(id: string, data: Partial<PatientEntity>): Promise<PatientEntity | null> {
    const { name, birth_date, phone, email, gender, occupation, main_complaint, notes } = data;
    this.db.prepare(`
      UPDATE patients SET name = COALESCE(?, name), birth_date = COALESCE(?, birth_date),
        phone = COALESCE(?, phone), email = COALESCE(?, email), gender = COALESCE(?, gender),
        occupation = COALESCE(?, occupation), main_complaint = COALESCE(?, main_complaint),
        notes = COALESCE(?, notes) WHERE id = ?
    `).run(name, birth_date, phone, email, gender, occupation, main_complaint, notes, id);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
}
