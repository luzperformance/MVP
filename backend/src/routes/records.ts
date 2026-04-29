import { Router } from 'express';
import { authMiddleware } from '../controllers/middleware/auth';
import { RecordsController } from '../controllers/api/RecordsController';
import { RecordService } from '../models/services/RecordService';
import { RecordRepository } from '../models/repositories/RecordRepository';

export const recordsRouter = Router();

const recordRepo = new RecordRepository();
const recordService = new RecordService(recordRepo);
const recordsController = new RecordsController(recordService);

recordsRouter.use(authMiddleware);

recordsRouter.get('/:patientId/pre-consult-summary', (req: any, res) => recordsController.getPreConsultSummary(req, res));
recordsRouter.get('/:patientId/records', (req: any, res) => recordsController.getAllByPatient(req, res));
recordsRouter.get('/:patientId/records/:id', (req: any, res) => recordsController.getById(req, res));
recordsRouter.post('/:patientId/records', (req: any, res) => recordsController.create(req, res));
recordsRouter.put('/:patientId/records/:id', (req: any, res) => recordsController.update(req, res));
