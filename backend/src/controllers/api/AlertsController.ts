import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AlertService } from '../../models/services/AlertService';

export class AlertsController {
  constructor(private alertService: AlertService) {}

  async getAlerts(_req: AuthRequest, res: Response) {
    try {
      const alerts = await this.alertService.getActiveAlerts();
      return res.json(alerts);
    } catch (error) {
      console.error('Error in AlertsController.getAlerts:', error);
      return res.status(500).json({ error: 'Erro ao carregar alertas.' });
    }
  }

  async getSummary(_req: AuthRequest, res: Response) {
    try {
      const summary = await this.alertService.getAlertSummary();
      return res.json(summary);
    } catch (error) {
      console.error('Error in AlertsController.getSummary:', error);
      return res.status(500).json({ error: 'Erro ao carregar resumo de alertas.' });
    }
  }
}
