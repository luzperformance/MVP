import { ExamRepository } from '../repositories/ExamRepository';

export class ExamService {
  constructor(private examRepo: ExamRepository) {}

  async getPatientExams(patientId: string) {
    return this.examRepo.findByPatientId(patientId);
  }

  async getTimeline(patientId: string, markerNames?: string[]) {
    const { data, availableMarkers } = await this.examRepo.getTimeline(patientId, markerNames);
    
    // Group logic from exams.ts moved here
    const grouped: Record<string, any> = {};
    const dates = new Set<string>();

    for (const row of data as any[]) {
      dates.add(row.exam_date);
      if (!grouped[row.marker_name]) {
        grouped[row.marker_name] = {
          name: row.marker_name,
          category: row.marker_category,
          unit: row.unit,
          ref_min: row.ref_min,
          ref_max: row.ref_max,
          optimal_min: row.optimal_min,
          optimal_max: row.optimal_max,
          data: [],
        };
      }
      grouped[row.marker_name].data.push({ date: row.exam_date, value: row.value, status: row.status });
    }

    return { timeline: Object.values(grouped), dates: [...dates].sort(), availableMarkers };
  }

  async createExam(patientId: string, data: any, pdfFilename?: string) {
    return this.examRepo.create(patientId, data, pdfFilename);
  }

  async deleteExam(id: string, patientId: string) {
    return this.examRepo.delete(id, patientId);
  }
}
