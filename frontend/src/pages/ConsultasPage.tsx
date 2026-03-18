import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stethoscope, Clock, MapPin, ExternalLink, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { CalendarEventsResponse, CalendarEventItem } from '@shared/types';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = toDateString(new Date());
  const tomorrow = toDateString(new Date(Date.now() + 86400000));
  if (dateStr === today) return 'Hoje';
  if (dateStr === tomorrow) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTimeRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  const s = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${s} – ${e}`;
}

function isEventNow(start: string, end: string, isAllDay: boolean): boolean {
  if (isAllDay) return false;
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() > now;
}

export default function ConsultasPage() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const abortRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const base = new Date(selectedDate + 'T00:00:00');
      const timeMin = base.toISOString();
      const end = new Date(base);
      end.setDate(end.getDate() + 1);
      const timeMax = end.toISOString();

      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!res.ok) {
        setData({ configured: false, events: [] });
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
  }, [token, selectedDate]);

  useEffect(() => {
    fetchEvents();
    return () => { abortRef.current?.abort(); };
  }, [fetchEvents]);

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(toDateString(d));
  };

  const goToToday = () => setSelectedDate(toDateString(new Date()));

  const events = data?.events ?? [];
  const isToday = selectedDate === toDateString(new Date());

  return (
    <div className="agenda-page">
      <div className="page-header">
        <Stethoscope size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Consultas do Dia
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            Agenda via Google Calendar
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Day navigator */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigateDay(-1)} aria-label="Dia anterior">
            <ChevronLeft size={18} aria-hidden />
          </button>
          <div style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
            <div className="font-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--luz-gold)', letterSpacing: '0.04em', textTransform: 'capitalize' }}>
              {formatDayHeader(selectedDate)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigateDay(1)} aria-label="Próximo dia">
            <ChevronRight size={18} aria-hidden />
          </button>
          {!isToday && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={goToToday} title="Voltar para hoje">
              <CalendarDays size={16} aria-hidden />
              Hoje
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando consultas...</p>
          </div>
        ) : !data?.configured ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Stethoscope size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Agenda não configurada</h3>
            <p>Configure <code>GOOGLE_CALENDAR_API_KEY</code> e <code>GOOGLE_CALENDAR_ID</code> no servidor.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <CalendarDays size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhuma consulta neste dia</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>Não há eventos agendados para {formatDayHeader(selectedDate).toLowerCase()}.</p>
          </div>
        ) : (
          <div className="stagger stagger-sections agenda-content">
            <div className="card animate-fade-in-up" style={{ marginBottom: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="exam-section-label" style={{ marginBottom: 0 }}>
                {events.length} consulta{events.length > 1 ? 's' : ''}
              </span>
            </div>

            {events.map((ev: CalendarEventItem) => {
              const now = isEventNow(ev.start, ev.end, ev.isAllDay);
              return (
                <div
                  key={ev.id}
                  className="card animate-fade-in-up agenda-day-card"
                  style={{
                    marginBottom: 12,
                    borderLeft: now ? '3px solid var(--luz-gold)' : '3px solid transparent',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Time column */}
                    <div style={{ minWidth: 72, flexShrink: 0, textAlign: 'center', paddingTop: 2 }}>
                      {ev.isAllDay ? (
                        <span className="badge badge-normal" style={{ fontSize: 10 }}>DIA TODO</span>
                      ) : (
                        <>
                          <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: now ? 'var(--luz-gold)' : 'var(--luz-white)', lineHeight: 1.2 }}>
                            {new Date(ev.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)', marginTop: 2 }}>
                            {new Date(ev.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {now && <span className="badge badge-normal" style={{ fontSize: 9 }}>AGORA</span>}
                        <div className="agenda-event-summary" style={{ fontSize: 15 }}>{ev.summary}</div>
                      </div>

                      <div className="agenda-event-time" style={{ marginBottom: ev.location ? 6 : 0 }}>
                        <Clock size={13} aria-hidden />
                        {formatTimeRange(ev.start, ev.end, ev.isAllDay)}
                      </div>

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
                          <ExternalLink size={13} aria-hidden />
                          Abrir no Google
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
