import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../controllers/middleware/auth';
import { getDb } from '../models/repositories/Database';
import {
  getOAuthUrl,
  exchangeCode,
  ensureValidToken,
  listEvents,
  createEvent,
  deleteEvent,
  type GoogleTokens,
} from '../services/googleCalendar';

export const calendarRouter = Router();

calendarRouter.use(authMiddleware);

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load stored OAuth tokens for the authenticated doctor */
function getDoctorTokens(doctorId: number): GoogleTokens | null {
  const db = getDb();
  const row = db.prepare('SELECT google_tokens FROM doctor WHERE id = ?').get(doctorId) as
    | { google_tokens: string | null }
    | undefined;
  if (!row?.google_tokens) return null;
  try {
    return JSON.parse(row.google_tokens) as GoogleTokens;
  } catch {
    return null;
  }
}

/** Persist updated tokens for a doctor */
function saveDoctorTokens(doctorId: number, tokens: GoogleTokens) {
  const db = getDb();
  db.prepare('UPDATE doctor SET google_tokens = ? WHERE id = ?').run(
    JSON.stringify(tokens),
    doctorId,
  );
}

/** Get valid access token for the current doctor, refreshing if needed */
async function getValidAccessToken(doctorId: number): Promise<string | null> {
  const tokens = getDoctorTokens(doctorId);
  if (!tokens) return null;

  const fresh = await ensureValidToken(tokens);
  if (!fresh) return null;

  // Persist if refreshed
  if (fresh.access_token !== tokens.access_token) {
    saveDoctorTokens(doctorId, fresh);
  }

  return fresh.access_token;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/calendar/events
 * Lists events. Uses OAuth token if available, otherwise falls back to API Key.
 */
calendarRouter.get('/events', async (req: AuthRequest, res: Response) => {
  const timeMin =
    (req.query.timeMin as string) || new Date().toISOString();
  const timeMax =
    (req.query.timeMax as string) ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString();
    })();

  // Try OAuth first for richer data
  if (req.doctorId) {
    const accessToken = await getValidAccessToken(req.doctorId).catch(() => null);
    if (accessToken) {
      try {
        const rawEvents = await listEvents(accessToken, CALENDAR_ID, timeMin, timeMax);
        const events = rawEvents.map((e) => ({
          id: e.id,
          summary: e.summary || '(Sem título)',
          description: e.description,
          location: e.location,
          start: e.start.dateTime || e.start.date || '',
          end: e.end.dateTime || e.end.date || '',
          htmlLink: e.htmlLink,
          isAllDay: !e.start.dateTime,
        }));
        return res.json({ configured: true, events, authMode: 'oauth' });
      } catch (err: any) {
        // Fall through to API Key
        console.warn('[GCal] OAuth list failed, falling back to API Key:', err.message);
      }
    }
  }

  // Fallback: API Key (read-only)
  if (!API_KEY) {
    return res.json({
      configured: false,
      events: [],
      message: 'Configure GOOGLE_CALENDAR_API_KEY ou autorize via OAuth.',
    });
  }

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
  );
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '60');

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
    const events = (data.items || []).map((e: any) => ({
      id: e.id,
      summary: e.summary || '(Sem título)',
      description: e.description,
      location: e.location,
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      htmlLink: e.htmlLink,
      isAllDay: !!e.start?.date,
    }));
    return res.json({ configured: true, events, authMode: 'apikey', timeZone: data.timeZone });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      events: [],
      error: err?.message || 'Erro ao conectar com Google Calendar.',
    });
  }
});

/**
 * GET /api/calendar/oauth/url
 * Returns the Google OAuth2 authorization URL.
 */
calendarRouter.get('/oauth/url', (req: AuthRequest, res: Response) => {
  const doctorId = req.doctorId;
  const url = getOAuthUrl(doctorId ? String(doctorId) : undefined);
  if (!url) {
    return res.status(503).json({
      error: 'GOOGLE_CLIENT_ID e GOOGLE_REDIRECT_URI não configurados no servidor.',
    });
  }
  return res.json({ url });
});

/**
 * GET /api/calendar/oauth/callback
 * Google redirects here after user consents. Exchanges code for tokens.
 */
calendarRouter.get('/oauth/callback', async (req: AuthRequest, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agenda?oauth=denied`,
    );
  }

  if (!code) {
    return res.status(400).json({ error: 'Código de autorização ausente.' });
  }

  const tokens = await exchangeCode(code);
  if (!tokens) {
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agenda?oauth=error`,
    );
  }

  // Save tokens — state carries the doctorId
  const doctorId = state ? parseInt(state, 10) : null;
  if (doctorId) {
    saveDoctorTokens(doctorId, tokens);
  }

  return res.redirect(
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agenda?oauth=success`,
  );
});

/**
 * GET /api/calendar/oauth/status
 * Returns whether current doctor has OAuth tokens stored.
 */
calendarRouter.get('/oauth/status', (req: AuthRequest, res: Response) => {
  const doctorId = req.doctorId;
  if (!doctorId) return res.json({ connected: false });

  const tokens = getDoctorTokens(doctorId);
  const oauthConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return res.json({
    connected: !!tokens,
    oauthConfigured,
    apiKeyConfigured: !!API_KEY,
  });
});

/**
 * POST /api/calendar/events
 * Creates a new event in Google Calendar. Requires OAuth tokens.
 */
calendarRouter.post('/events', async (req: AuthRequest, res: Response) => {
  const doctorId = req.doctorId;
  if (!doctorId) return res.status(401).json({ error: 'Não autenticado.' });

  const accessToken = await getValidAccessToken(doctorId);
  if (!accessToken) {
    const authUrl = getOAuthUrl(String(doctorId));
    return res.status(403).json({
      error: 'Google Calendar não autorizado. Faça o login OAuth.',
      requiresAuth: true,
      authUrl,
    });
  }

  const { summary, description, location, startDateTime, endDateTime, patientName } = req.body;

  if (!summary || !startDateTime || !endDateTime) {
    return res.status(400).json({ error: 'summary, startDateTime e endDateTime são obrigatórios.' });
  }

  const timeZone = 'America/Sao_Paulo';
  const fullDescription = [
    patientName ? `Paciente: ${patientName}` : '',
    description || '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const event = await createEvent(accessToken, CALENDAR_ID, {
      summary,
      description: fullDescription || undefined,
      location,
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone },
    });

    return res.status(201).json({
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Removes an event from Google Calendar. Requires OAuth tokens.
 */
calendarRouter.delete('/events/:id', async (req: AuthRequest, res: Response) => {
  const doctorId = req.doctorId;
  if (!doctorId) return res.status(401).json({ error: 'Não autenticado.' });

  const accessToken = await getValidAccessToken(doctorId);
  if (!accessToken) {
    return res.status(403).json({ error: 'Google Calendar não autorizado.' });
  }

  try {
    await deleteEvent(accessToken, CALENDAR_ID, req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
