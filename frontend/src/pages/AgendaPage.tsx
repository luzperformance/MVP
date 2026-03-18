import React, { useState, useEffect, useCallback, useRef } from 'react';
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

function formatEventRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  const s = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${s} – ${e}`;
}

function groupEventsByDate(events: CalendarEventItem[]): { date: string; label: string; items: CalendarEventItem[] }[] {
  const byDate: Record<string, CalendarEventItem[]> = {};
  for (const ev of events) {
    const d = ev.start.slice(0, 10);
    (byDate[d] ??= []).push(ev);
  }
  return Object.keys(byDate)
    .sort()
    .map(date => ({
      date,
      label: formatEventDate(date + 'T12:00:00'),
      items: byDate[date].sort((a, b) => a.start.localeCompare(b.start)),
    }));
}

export default function AgendaPage() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 14 * 86_400_000).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!res.ok) {
        setData({ configured: false, events: [], error: 'Erro ao carregar agenda.' });
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setData({ configured: false, events: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
    return () => { abortRef.current?.abort(); };
  }, [fetchEvents]);

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
            <Calendar size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Agenda não configurada</h3>
            <p>Configure <code>GOOGLE_CALENDAR_API_KEY</code> e <code>GOOGLE_CALENDAR_ID</code> no servidor.</p>
          </div>
        ) : data.error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Calendar size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro ao carregar</h3>
            <p>{data.error}</p>
            <button type="button" className="btn btn-ghost" onClick={fetchEvents} style={{ marginTop: 12 }}>Tentar novamente</button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Calendar size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhum evento nos próximos 14 dias</h3>
            <p>Seus compromissos aparecerão aqui quando houver eventos no calendário.</p>
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
