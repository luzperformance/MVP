import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ExamService } from '../../models/services/ExamService';

export class ExamsController {
  constructor(private examService: ExamService) {}

  async getAllByPatient(req: AuthRequest, res: Response) {
    try {
      const exams = await this.examService.getPatientExams(req.params.patientId);
      return res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ error: 'Failed to fetch exams' });
    }
  }

  async getTimeline(req: AuthRequest, res: Response) {
    try {
      const { markers } = req.query;
      const markerNames = markers ? (markers as string).split(',').map(m => m.trim()) : undefined;
      const result = await this.examService.getTimeline(req.params.patientId, markerNames);
      return res.json(result);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const result = await this.examService.createExam(
        req.params.patientId,
        req.body,
        req.file?.filename
      );
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ error: 'Failed to create exam' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await this.examService.deleteExam(req.params.id, req.params.patientId);
      return res.json({ message: 'Exame removido.' });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ error: 'Failed to delete exam' });
    }
  }
}
