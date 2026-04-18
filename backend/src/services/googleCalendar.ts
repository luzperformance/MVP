/**
 * Google Calendar API v3 — Service
 * Prontuário LuzPerformance
 *
 * Supports:
 *  - OAuth2 flow (authorization URL → code exchange → token refresh)
 *  - List events (authenticated)
 *  - Create event (authenticated, writes to Google Calendar)
 *  - Delete event (authenticated)
 */

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number; // Unix ms
  token_type: string;
  scope: string;
}

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

function getRequiredEnv(key: string): string | null {
  return process.env[key] || null;
}

/** Build OAuth2 authorization URL */
export function getOAuthUrl(state?: string): string | null {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI');
  if (!clientId || !redirectUri) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    ...(state ? { state } : {}),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange authorization code for tokens */
export async function exchangeCode(code: string): Promise<GoogleTokens | null> {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI');
  if (!clientId || !clientSecret || !redirectUri) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    console.error('[GCal] exchangeCode failed:', await res.text());
    return null;
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

/** Refresh access token using refresh token */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens | null> {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    console.error('[GCal] refreshAccessToken failed:', await res.text());
    return null;
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Google may not re-send refresh_token
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

/** Ensure tokens are valid, refreshing if needed */
export async function ensureValidToken(tokens: GoogleTokens): Promise<GoogleTokens | null> {
  // Refresh 60 seconds before expiry
  if (tokens.expiry_date - Date.now() < 60_000) {
    if (!tokens.refresh_token) return null;
    return refreshAccessToken(tokens.refresh_token);
  }
  return tokens;
}

/** List events from Google Calendar (authenticated) */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  maxResults = 50,
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', String(maxResults));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to list events');
  }

  const data = await res.json();
  return data.items || [];
}

/** Create an event in Google Calendar */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  payload: GoogleCalendarEventPayload,
): Promise<GoogleCalendarEvent> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create event');
  }

  return res.json();
}

/** Delete an event from Google Calendar */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete event');
  }
}
