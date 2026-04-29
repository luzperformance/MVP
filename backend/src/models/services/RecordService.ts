import { RecordRepository } from '../repositories/RecordRepository';
import { RecordEntity } from '../entities/Record';
import { v4 as uuidv4 } from 'uuid';
import { generatePreConsultSummary, type PreConsultData } from '../../services/preConsultSummary';
import { getDb } from '../repositories/Database';

export class RecordService {
  constructor(private recordRepo: RecordRepository) {}

  async getPatientRecords(patientId: string): Promise<RecordEntity[]> {
    return this.recordRepo.findByPatientId(patientId);
  }

  async getRecordById(id: string, patientId: string): Promise<RecordEntity | null> {
    return this.recordRepo.findById(id, patientId);
  }

  async createRecord(patientId: string, data: Partial<RecordEntity>): Promise<RecordEntity> {
    const id = uuidv4();
    return this.recordRepo.create({ ...data, id, patient_id: patientId });
  }

  async updateRecord(id: string, patientId: string, data: Partial<RecordEntity>): Promise<RecordEntity | null> {
    return this.recordRepo.update(id, patientId, data);
  }

  async getPreConsultSummary(patientId: string): Promise<string> {
    const db = getDb();
    
    // Logic from records.ts moved here
    const patient = db.prepare(
      'SELECT id, name, birth_date, main_complaint, notes, observations, last_consultation, last_prescription, last_exam FROM patients WHERE id = ? AND deleted_at IS NULL'
    ).get(patientId) as Record<string, unknown> | undefined;

    if (!patient) {
      throw new Error('Paciente não encontrado.');
    }

    const records = await this.recordRepo.getRecentForPreConsult(patientId);
    
    const exams = db.prepare(
      'SELECT id, exam_date, lab_name FROM lab_exams WHERE patient_id = ? ORDER BY exam_date DESC LIMIT 2'
    ).all(patientId) as Array<Record<string, unknown>>;

    const examsWithMarkers = exams.map((exam: any) => {
      const markers = db.prepare(
        'SELECT marker_name, value, unit, status, ref_min, ref_max FROM lab_markers WHERE exam_id = ? ORDER BY marker_category, marker_name'
      ).all(exam.id) as any[];
      return {
        exam_date: String(exam.exam_date),
        lab_name: exam.lab_name,
        markers,
      };
    });

    const data: PreConsultData = {
      patient: {
        name: String(patient.name),
        birth_date: patient.birth_date as string,
        main_complaint: patient.main_complaint as string,
        notes: patient.notes as string,
        observations: patient.observations as string,
        last_consultation: patient.last_consultation as string,
        last_prescription: patient.last_prescription as string,
        last_exam: patient.last_exam as string,
      },
      recentRecords: records.map((r: any) => ({
        consultation_date: String(r.consultation_date),
        type: String(r.type),
        soap_subjective: r.soap_subjective,
        soap_objective: r.soap_objective,
        soap_assessment: r.soap_assessment,
        soap_plan: r.soap_plan,
      })),
      recentExams: examsWithMarkers.map((e: any) => ({
        exam_date: e.exam_date,
        lab_name: e.lab_name,
        markers: e.markers.map((m: any) => ({
          marker_name: String(m.marker_name),
          value: Number(m.value),
          unit: String(m.unit),
          status: m.status,
          ref_min: m.ref_min,
          ref_max: m.ref_max,
        })),
      })),
    };

    return generatePreConsultSummary(data);
  }
}
