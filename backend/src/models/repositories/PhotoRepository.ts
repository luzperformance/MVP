import { getDb } from './Database';

export class PhotoRepository {
  private db = getDb();

  async findByPatientId(patientId: string, category?: string) {
    if (category) {
      return this.db.prepare('SELECT * FROM photos WHERE patient_id = ? AND category = ? ORDER BY taken_at DESC').all(patientId, category);
    }
    return this.db.prepare('SELECT * FROM photos WHERE patient_id = ? ORDER BY taken_at DESC').all(patientId);
  }

  async findById(id: string, patientId: string) {
    return this.db.prepare('SELECT * FROM photos WHERE id = ? AND patient_id = ?').get(id, patientId);
  }

  async create(data: any) {
    const { id, patient_id, record_id, filename, original_name, mime_type, size_bytes, category, description, taken_at } = data;
    this.db.prepare(`
      INSERT INTO photos (id, patient_id, record_id, filename, original_name, mime_type, size_bytes, category, description, taken_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, record_id || null, filename, original_name, mime_type, size_bytes, category || 'evolucao', description || null, taken_at || null);
    return this.db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  }

  async delete(id: string) {
    return this.db.prepare('DELETE FROM photos WHERE id = ?').run(id);
  }
}
