import { getDb } from './Database';
import { ExamEntity, MarkerEntity } from '../entities/Exam';
import { v4 as uuidv4 } from 'uuid';
import { computeMarkerStatus } from '../../db/labMarkerStatus';

export class ExamRepository {
  db = getDb();

  async findByPatientId(patientId: string): Promise<any[]> {
    const exams = this.db.prepare(
      'SELECT * FROM lab_exams WHERE patient_id = ? ORDER BY exam_date DESC'
    ).all(patientId);

    return exams.map((exam: any) => ({
      ...exam,
      markers: this.db.prepare('SELECT * FROM lab_markers WHERE exam_id = ? ORDER BY marker_category, marker_name').all(exam.id),
    }));
  }

  async getTimeline(patientId: string, markerNames?: string[]): Promise<any> {
    let markerFilter = '';
    let params: any[] = [patientId];

    if (markerNames && markerNames.length > 0) {
      markerFilter = `AND lm.marker_name IN (${markerNames.map(() => '?').join(',')})`;
      params = [...params, ...markerNames];
    }

    const data = this.db.prepare(`
      SELECT le.exam_date, lm.marker_name, lm.marker_category, lm.value, lm.unit,
             lm.ref_min, lm.ref_max, lm.optimal_min, lm.optimal_max, lm.status
      FROM lab_markers lm
      JOIN lab_exams le ON le.id = lm.exam_id
      WHERE le.patient_id = ? ${markerFilter}
      ORDER BY le.exam_date ASC, lm.marker_name
    `).all(...params);

    const availableMarkers = this.db.prepare(`
      SELECT DISTINCT lm.marker_name, lm.marker_category, lm.unit
      FROM lab_markers lm JOIN lab_exams le ON le.id = lm.exam_id
      WHERE le.patient_id = ? ORDER BY lm.marker_category, lm.marker_name
    `).all(patientId);

    return { data, availableMarkers };
  }

  async create(patientId: string, data: any, pdfFilename?: string): Promise<any> {
    const id = uuidv4();
    const { exam_date, lab_name, notes, markers } = data;

    this.db.prepare(`
      INSERT INTO lab_exams (id, patient_id, exam_date, lab_name, pdf_filename, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, patientId, exam_date, lab_name || null, pdfFilename || null, notes || null);

    if (markers) {
      const parsedMarkers = typeof markers === 'string' ? JSON.parse(markers) : markers;
      const insertMarker = this.db.prepare(`
        INSERT INTO lab_markers (id, exam_id, marker_name, marker_category, value, unit, ref_min, ref_max, optimal_min, optimal_max, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = this.db.transaction((ms: any[]) => {
        for (const m of ms) {
          const status = computeMarkerStatus(
            m.value,
            m.ref_min ?? null,
            m.ref_max ?? null,
            m.optimal_min ?? null,
            m.optimal_max ?? null
          );
          insertMarker.run(
            uuidv4(),
            id,
            m.marker_name,
            m.marker_category || null,
            m.value,
            m.unit,
            m.ref_min ?? null,
            m.ref_max ?? null,
            m.optimal_min ?? null,
            m.optimal_max ?? null,
            status
          );
        }
      });
      insertMany(parsedMarkers);
    }

    const exam = this.db.prepare('SELECT * FROM lab_exams WHERE id = ?').get(id);
    const examMarkers = this.db.prepare('SELECT * FROM lab_markers WHERE exam_id = ?').all(id);
    return { ...exam as any, markers: examMarkers };
  }

  async delete(id: string, patientId: string): Promise<void> {
    this.db.prepare('DELETE FROM lab_exams WHERE id = ? AND patient_id = ?').run(id, patientId);
  }
}
