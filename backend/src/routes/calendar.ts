import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const calendarRouter = Router();
calendarRouter.use(authMiddleware);

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
  isAllDay: boolean;
}

/** GET /api/calendar/events — Eventos do Google Calendar (timeMin, timeMax em ISO) */
calendarRouter.get('/events', async (req: AuthRequest, res: Response) => {
  if (!API_KEY) {
    return res.json({
      configured: false,
      events: [],
      message: 'Configure GOOGLE_CALENDAR_API_KEY e GOOGLE_CALENDAR_ID no servidor.',
    });
  }

  const timeMin = (req.query.timeMin as string) || new Date().toISOString();
  const timeMax = (req.query.timeMax as string) || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  })();

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  try {
    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        configured: true,
        events: [],
        error: data.error?.message || 'Erro ao buscar eventos.',
      });
    }

    const events: CalendarEventItem[] = (data.items || []).map((e: any) => {
      const start = e.start?.dateTime || e.start?.date;
      const end = e.end?.dateTime || e.end?.date;
      const isAllDay = !!e.start?.date;
      return {
        id: e.id,
        summary: e.summary || '(Sem título)',
        description: e.description,
        location: e.location,
        start,
        end,
        htmlLink: e.htmlLink,
        isAllDay,
      };
    });

    return res.json({
      configured: true,
      events,
      timeZone: data.timeZone,
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      events: [],
      error: err?.message || 'Erro ao conectar com o Google Calendar.',
    });
  }
});
