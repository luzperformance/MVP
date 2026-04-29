import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CalendarService } from '../../models/services/CalendarService';

export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  async getEvents(req: AuthRequest, res: Response) {
    try {
      const { timeMin, timeMax } = req.query;
      const result = await this.calendarService.getEvents(
        timeMin as string,
        timeMax as string
      );
      return res.json(result);
    } catch (error: any) {
      console.error('Error in CalendarController.getEvents:', error);
      return res.status(500).json({ 
        configured: true,
        events: [],
        error: error.message || 'Erro ao conectar com o Google Calendar.' 
      });
    }
  }
}
