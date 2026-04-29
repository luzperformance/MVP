import { Router } from 'express';
import { authMiddleware } from '../controllers/middleware/auth';
import { GestaoController } from '../controllers/api/GestaoController';
import { GestaoService } from '../models/services/GestaoService';
import { GestaoRepository } from '../models/repositories/GestaoRepository';

export const gestaoRouter = Router();

const gestaoRepo = new GestaoRepository();
const gestaoService = new GestaoService(gestaoRepo);
const gestaoController = new GestaoController(gestaoService);

gestaoRouter.use(authMiddleware);

// GET /api/gestao — list all patients for management table
gestaoRouter.get('/', (req: any, res) => gestaoController.getAll(req, res));

// GET /api/gestao/summary — KPIs for the management dashboard
gestaoRouter.get('/summary', (req: any, res) => gestaoController.getSummary(req, res));

// PUT /api/gestao/:id — update a patient's management fields (inline edit)
gestaoRouter.put('/:id', (req: any, res) => gestaoController.update(req, res));

// POST /api/gestao/import — import CSV in the same format as the spreadsheet
gestaoRouter.post('/import', (req: any, res) => gestaoController.import(req, res));
