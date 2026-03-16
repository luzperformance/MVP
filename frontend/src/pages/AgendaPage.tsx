import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { CalendarEventsResponse, CalendarEventItem } from '../../shared/types';

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatEventTime(iso: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEventRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  const s = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${s} – ${e}`;
}

function groupEventsByDate(events: CalendarEventItem[]): { date: string; label: string; items: CalendarEventItem[] }[] {
  const byDate: Record<string, CalendarEventItem[]> = {};
  events.forEach(ev => {
    const d = ev.start.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(ev);
  });
  return Object.keys(byDate)
    .sort()
    .map(date => ({
      date,
      label: formatEventDate(date + 'T12:00:00'),
      items: byDate[date].sort((a, b) => a.start.localeCompare(b.start)),
    }));
}

export default function AgendaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setData(json);
    } catch {
      setData({ configured: false, events: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const grouped = data?.events?.length ? groupEventsByDate(data.events) : [];

  return (
    <div className="agenda-page">
      <div className="page-header">
        <Calendar size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Agenda
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            Próximos 14 dias — Google Calendar
          </div>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando agenda...</p>
          </div>
        ) : !data?.configured ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Calendar size={48} color="var(--luz-gold)" className="agenda-empty-icon" aria-hidden />
            <h3 className="exam-section-title">Agenda não configurada</h3>
            <p>Configure <code>GOOGLE_CALENDAR_API_KEY</code> e <code>GOOGLE_CALENDAR_ID</code> no servidor para exibir eventos do Google Calendar.</p>
          </div>
        ) : data.error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Calendar size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro ao carregar</h3>
            <p>{data.error}</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Calendar size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhum evento nos próximos 14 dias</h3>
            <p>Seus compromissos aparecerão aqui quando houver eventos no calendário configurado.</p>
          </div>
        ) : (
          <div className="stagger stagger-sections agenda-content">
            {grouped.map(({ date, label, items }) => (
              <div key={date} className="card animate-fade-in-up agenda-day-card">
                <div className="agenda-day-label">{label}</div>
                <ul className="agenda-event-list">
                  {items.map(ev => (
                    <li key={ev.id} className="agenda-event-item">
                      <div className="agenda-event-time">
                        <Clock size={14} aria-hidden />
                        {formatEventRange(ev.start, ev.end, ev.isAllDay)}
                      </div>
                      <div className="agenda-event-summary">{ev.summary}</div>
                      {ev.location && (
                        <div className="agenda-event-meta">
                          <MapPin size={12} aria-hidden />
                          {ev.location}
                        </div>
                      )}
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="agenda-event-link"
                          aria-label="Abrir no Google Calendar"
                        >
                          <ExternalLink size={14} aria-hidden />
                          Abrir no Google
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
