import { LabExam, LabMarker } from '../../../../shared/types';

export interface ExamEntity extends LabExam {
  pdf_filename?: string;
}

export interface MarkerEntity extends LabMarker {
  exam_id: string;
}
