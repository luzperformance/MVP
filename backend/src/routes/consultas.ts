import { Router } from 'express';
import { authMiddleware } from '../controllers/middleware/auth';
import { ConsultasController } from '../controllers/api/ConsultasController';

export const consultasRouter = Router();
const consultasController = new ConsultasController();

consultasRouter.use(authMiddleware);

/** GET /api/consultas — Lista consultas (records) recentes com nome do paciente */
consultasRouter.get('/', (req: any, res) => consultasController.getAll(req, res));
