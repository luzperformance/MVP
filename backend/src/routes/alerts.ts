import { Router } from 'express';
import { authMiddleware } from '../controllers/middleware/auth';
import { AlertsController } from '../controllers/api/AlertsController';
import { AlertService } from '../models/services/AlertService';
import { AlertRepository } from '../models/repositories/AlertRepository';

export const alertsRouter = Router();

const alertRepo = new AlertRepository();
const alertService = new AlertService(alertRepo);
const alertsController = new AlertsController(alertService);

alertsRouter.use(authMiddleware);

// GET /api/alerts — all active alerts
alertsRouter.get('/', (req: any, res) => alertsController.getAlerts(req, res));

// GET /api/alerts/summary — counts by type
alertsRouter.get('/summary', (req: any, res) => alertsController.getSummary(req, res));
