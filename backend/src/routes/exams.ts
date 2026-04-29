import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { authMiddleware } from '../controllers/middleware/auth';
import { ExamsController } from '../controllers/api/ExamsController';
import { ExamService } from '../models/services/ExamService';
import { ExamRepository } from '../models/repositories/ExamRepository';

export const examsRouter = Router();

const examRepo = new ExamRepository();
const examService = new ExamService(examRepo);
const examsController = new ExamsController(examService);

examsRouter.use(authMiddleware);

// Multer for exam PDFs
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.env.UPLOAD_PATH || './uploads', 'exams'));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  cb(null, file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/'));
}});

examsRouter.get('/:patientId/exams', (req: any, res) => examsController.getAllByPatient(req, res));
examsRouter.get('/:patientId/exams/timeline', (req: any, res) => examsController.getTimeline(req, res));
examsRouter.post('/:patientId/exams', upload.single('pdf'), (req: any, res) => examsController.create(req, res));
examsRouter.delete('/:patientId/exams/:id', (req: any, res) => examsController.delete(req, res));
