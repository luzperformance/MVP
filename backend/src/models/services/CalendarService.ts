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

export class CalendarService {
  private CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
  private API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

  async getEvents(timeMin?: string, timeMax?: string) {
    if (!this.API_KEY) {
      return {
        configured: false,
        events: [],
        message: 'Configure GOOGLE_CALENDAR_API_KEY e GOOGLE_CALENDAR_ID no servidor.'
      };
    }

    const min = timeMin || new Date().toISOString();
    const max = timeMax || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString();
    })();

    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.CALENDAR_ID)}/events`);
    url.searchParams.set('key', this.API_KEY);
    url.searchParams.set('timeMin', min);
    url.searchParams.set('timeMax', max);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error?.message || 'Erro ao buscar eventos no Google Calendar.');
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

    return {
      configured: true,
      events,
      timeZone: data.timeZone
    };
  }
}
