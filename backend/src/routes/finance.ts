import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../controllers/middleware/auth';
import { FinanceController } from '../controllers/api/FinanceController';
import { FinanceService } from '../models/services/FinanceService';
import { FinanceRepository } from '../models/repositories/FinanceRepository';

export const financeRouter = Router();

const financeRepo = new FinanceRepository();
const financeService = new FinanceService(financeRepo);
const financeController = new FinanceController(financeService);

financeRouter.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.csv$/i.test(file.originalname) || (file.mimetype === 'text/csv');
    cb(null, !!ok);
  },
});

financeRouter.get('/summary', (req: any, res) => financeController.getSummary(req, res));
financeRouter.get('/entries', (req: any, res) => financeController.getEntries(req, res));
financeRouter.post('/entries', (req: any, res) => financeController.create(req, res));
financeRouter.delete('/entries/:id', (req: any, res) => financeController.delete(req, res));
financeRouter.post('/import', upload.single('file'), (req: any, res) => financeController.import(req, res));
