import { getDb } from './Database';
import { RecordEntity } from '../entities/Record';

export class RecordRepository {
  db = getDb();

  async findByPatientId(patientId: string): Promise<RecordEntity[]> {
    const records = this.db.prepare(
      'SELECT * FROM records WHERE patient_id = ? ORDER BY consultation_date DESC'
    ).all(patientId);
    return records as RecordEntity[];
  }

  async findById(id: string, patientId: string): Promise<RecordEntity | null> {
    const record = this.db.prepare(
      'SELECT * FROM records WHERE id = ? AND patient_id = ?'
    ).get(id, patientId);
    return (record as RecordEntity) || null;
  }

  async create(data: Partial<RecordEntity>): Promise<RecordEntity> {
    const { id, patient_id, type, source, raw_input, soap_subjective,
            soap_objective, soap_assessment, soap_plan, notes, consultation_date, duration_minutes } = data;

    this.db.prepare(`
      INSERT INTO records (id, patient_id, type, source, raw_input, soap_subjective,
        soap_objective, soap_assessment, soap_plan, notes, consultation_date, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, type, source, raw_input || null, soap_subjective || null,
           soap_objective || null, soap_assessment || null, soap_plan || null,
           notes || null, consultation_date, duration_minutes || null);

    return this.findById(id!, patient_id!) as Promise<RecordEntity>;
  }

  async update(id: string, patientId: string, data: Partial<RecordEntity>): Promise<RecordEntity | null> {
    const { soap_subjective, soap_objective, soap_assessment, soap_plan, notes, duration_minutes } = data;
    this.db.prepare(`
      UPDATE records SET soap_subjective = COALESCE(?, soap_subjective),
        soap_objective = COALESCE(?, soap_objective),
        soap_assessment = COALESCE(?, soap_assessment),
        soap_plan = COALESCE(?, soap_plan),
        notes = COALESCE(?, notes),
        duration_minutes = COALESCE(?, duration_minutes)
      WHERE id = ? AND patient_id = ?
    `).run(soap_subjective, soap_objective, soap_assessment, soap_plan, notes, duration_minutes, id, patientId);

    return this.findById(id, patientId);
  }

  // Support for pre-consult data fetching
  async getRecentForPreConsult(patientId: string, limit = 5): Promise<any[]> {
    return this.db.prepare(
      'SELECT consultation_date, type, soap_subjective, soap_objective, soap_assessment, soap_plan FROM records WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT ?'
    ).all(patientId, limit);
  }
}
