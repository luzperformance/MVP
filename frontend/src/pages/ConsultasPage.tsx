import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stethoscope, Clock, MapPin, ExternalLink, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { CalendarEventsResponse, CalendarEventItem } from '@shared/types';

type Tab = 'hoje' | 'semana';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatTimeRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  return `${formatTimeShort(start)} – ${formatTimeShort(end)}`;
}

function isEventNow(start: string, end: string, isAllDay: boolean): boolean {
  if (isAllDay) return false;
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() > now;
}

function formatDayLabel(dateStr: string): string {
  const today = toDateString(new Date());
  const tomorrow = toDateString(new Date(Date.now() + 86400000));
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Hoje';
  if (dateStr === tomorrow) return 'Amanhã';
  if (dateStr === yesterday) return 'Ontem';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'short',
  });
}

function groupByDate(events: CalendarEventItem[]) {
  const map: Record<string, CalendarEventItem[]> = {};
  for (const ev of events) {
    const d = (ev.start || '').slice(0, 10);
    if (d) (map[d] ??= []).push(ev);
  }
  return Object.keys(map).sort().map(date => ({
    date,
    label: formatDayLabel(date),
    items: map[date].sort((a, b) => a.start.localeCompare(b.start)),
  }));
}

function EventRow({ ev, showDate }: { ev: CalendarEventItem; showDate?: boolean }) {
  const active = isEventNow(ev.start, ev.end, ev.isAllDay);
  const timeStr = ev.isAllDay ? 'ALL' : formatTimeShort(ev.start);

  return (
    <div
      className="card animate-fade-in-up consultas-event-row"
      style={{ borderLeft: `3px solid ${active ? 'var(--luz-gold)' : 'rgba(201,164,74,0.12)'}` }}
    >
      {/* Avatar de horário */}
      <div className="consultas-time-avatar" aria-hidden>
        {ev.isAllDay ? (
          <CalendarDays size={16} color="var(--luz-gold)" />
        ) : (
          <span className="font-display consultas-time-text">{timeStr}</span>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          {active && (
            <span className="badge badge-normal" style={{ fontSize: 9, padding: '2px 7px' }}>AGORA</span>
          )}
          <span style={{ fontWeight: 600, color: 'var(--luz-white)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.summary}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!ev.isAllDay && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--luz-gray-dark)' }}>
              <Clock size={11} aria-hidden />
              {formatTimeRange(ev.start, ev.end, ev.isAllDay)}
            </span>
          )}
          {showDate && (
            <span style={{ fontSize: 12, color: 'var(--luz-gold)', opacity: 0.7, textTransform: 'capitalize' }}>
              {formatDayLabel(ev.start.slice(0, 10))}
            </span>
          )}
          {ev.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--luz-gray-dark)' }}>
              <MapPin size={11} aria-hidden />
              {ev.location}
            </span>
          )}
        </div>
      </div>

      {/* Ação */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {ev.htmlLink && (
          <a
            href={ev.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '5px 10px', minHeight: 'auto', gap: 4 }}
            aria-label="Abrir no Google Calendar"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={11} aria-hidden />
          </a>
        )}
        <ChevronRight size={15} color="var(--luz-gray-dark)" aria-hidden />
      </div>
    </div>
  );
}

export default function ConsultasPage() {
  const token = useAuthStore(s => s.token);
  const [tab, setTab] = useState<Tab>('hoje');
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async (view: Tab) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(toDateString(now) + 'T00:00:00');
      const timeMin = view === 'hoje'
        ? new Date(todayStart.getTime() - 86400000).toISOString()   // ontem 00:00
        : todayStart.toISOString();
      const timeMax = view === 'hoje'
        ? new Date(todayStart.getTime() + 2 * 86400000).toISOString() // depois de amanhã 00:00
        : new Date(todayStart.getTime() + 7 * 86400000).toISOString();

      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!res.ok) { setData({ configured: false, events: [] }); return; }
      setData(await res.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setData({ configured: false, events: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents(tab);
    return () => { abortRef.current?.abort(); };
  }, [fetchEvents, tab]);

  const events = data?.events ?? [];
  const grouped = groupByDate(events);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Stethoscope size={20} color="var(--luz-gold)" aria-hidden />
          <div>
            <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
              Consultas
            </div>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
              {tab === 'hoje' ? 'Ontem · Hoje · Amanhã' : 'Próximos 7 dias'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(201,164,74,0.15)',
          borderRadius: 10, padding: 3, gap: 2,
        }}>
          {([
            { id: 'hoje' as Tab,   icon: Clock,        label: 'Hoje'   },
            { id: 'semana' as Tab, icon: CalendarDays,  label: 'Semana' },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.2s ease',
                background: tab === id ? 'rgba(201,164,74,0.18)' : 'transparent',
                color:      tab === id ? 'var(--luz-gold)'        : 'var(--luz-gray-dark)',
                boxShadow:  tab === id ? '0 0 0 1px rgba(201,164,74,0.3)' : 'none',
              }}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando consultas...</p>
          </div>

        ) : !data?.configured ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Stethoscope size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title" style={{ marginTop: 12 }}>Agenda não configurada</h3>
            <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, marginTop: 8 }}>
              Configure <code>GOOGLE_CALENDAR_API_KEY</code> e <code>GOOGLE_CALENDAR_ID</code> no servidor.
            </p>
          </div>

        ) : events.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <CalendarDays size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title" style={{ marginTop: 12 }}>
              {tab === 'hoje' ? 'Nenhuma consulta nestes 3 dias' : 'Nenhuma consulta esta semana'}
            </h3>
          </div>

        ) : tab === 'hoje' ? (
          /* ── 3 dias: Ontem · Hoje · Amanhã ── */
          <div className="stagger-sections" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(({ date, label, items }) => (
              <div key={date} className="animate-fade-in-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700,
                    color: date === toDateString(new Date()) ? 'var(--luz-gold)' : 'var(--luz-gray-dark)',
                    letterSpacing: '0.08em', textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'rgba(201,164,74,0.1)' }} />
                  <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>
                    {items.length} evento{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(ev => <EventRow key={ev.id} ev={ev} />)}
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── SEMANA: agrupado por dia ── */
          <div className="stagger-sections" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(({ date, label, items }) => (
              <div key={date} className="animate-fade-in-up">
                {/* Day separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700,
                    color: date === toDateString(new Date()) ? 'var(--luz-gold)' : 'var(--luz-gray-dark)',
                    letterSpacing: '0.08em', textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'rgba(201,164,74,0.1)' }} />
                  <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>
                    {items.length} evento{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(ev => <EventRow key={ev.id} ev={ev} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
