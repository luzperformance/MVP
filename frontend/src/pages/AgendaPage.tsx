import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, LayoutGrid, Plus, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { CalendarEventsResponse, CalendarEventItem } from '@shared/types';

const GCAL_EMBED_URL = 
  'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FSao_Paulo&showPrint=0&title=Consult%C3%B3rio&mode=MONTH&src=luzardi18%40gmail.com&color=%234285f4';

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

type ViewMode = 'calendario' | 'lista';

export default function AgendaPage() {
  const token = useAuthStore(s => s.token);
  const doctor = useAuthStore(s => s.doctor);
  const canEdit = !!doctor?.can_edit_agenda;
  const [view, setView] = useState<ViewMode>('calendario');
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
      if (!res.ok) { setData({ configured: false, events: [], error: 'Erro ao carregar.' }); return; }
      setData(await res.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setData({ configured: false, events: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'lista') fetchEvents();
    return () => { abortRef.current?.abort(); };
  }, [view, fetchEvents]);

  const grouped = data?.events?.length ? groupEventsByDate(data.events) : [];

  return (
    <div className="agenda-page">
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={20} color="var(--luz-gold)" aria-hidden />
          <div>
            <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
              Mês
            </div>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>Consultório — Visão Mensal</div>
          </div>
        </div>

        
      </div>

      <div className="page-content" style={{ paddingTop: 20 }}>

        {/* ── CALENDÁRIO ── */}
        {view === 'calendario' && (
          <div className="animate-fade-in-up agenda-gcal-wrap">
            {/* decorative top bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'var(--luz-navy-dark)',
              borderBottom: '1px solid rgba(201,164,74,0.15)',
              borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'linear-gradient(135deg, #4285f4, #34a853)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={14} color="#fff" aria-hidden />
                </div>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--luz-gold)', letterSpacing: '0.08em' }}>
                  GOOGLE CALENDAR
                </span>
              </div>
              
              {canEdit ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a
                    href="https://calendar.google.com/calendar/r/eventedit?text=Compromisso%3A+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ 
                      fontSize: 12, padding: '7px 14px', minHeight: 'auto',
                      border: '1px solid var(--luz-gold)', color: 'var(--luz-gold)',
                      borderRadius: 6, transition: 'all 0.3s ease',
                      fontWeight: 600, boxShadow: '0 4px 15px rgba(201, 164, 74, 0.15)'
                    }}
                  >
                    <Plus size={14} aria-hidden style={{ marginRight: 6 }} />
                    Novo
                  </a>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ 
                      fontSize: 12, padding: '7px 14px', minHeight: 'auto',
                      border: '1px solid rgba(201,164,74,0.2)',
                      borderRadius: 6, transition: 'all 0.3s ease'
                    }}
                  >
                    <Settings size={14} aria-hidden style={{ marginRight: 6 }} />
                    Gerenciar
                  </a>
                </div>
              ) : (
                <div style={{ 
                  fontSize: 11, color: 'var(--luz-gray-dark)', 
                  border: '1px dashed rgba(255,255,255,0.1)', 
                  padding: '6px 12px', borderRadius: 4, letterSpacing: '0.04em'
                }}>
                  Modo Visualização
                </div>
              )}
            </div>

            {/* iframe */}
            <div className="agenda-gcal-frame-wrap">
              <iframe
                src={GCAL_EMBED_URL}
                title="Agenda Consultório"
                className="agenda-gcal-frame"
                frameBorder="0"
                scrolling="no"
                aria-label="Calendário Google do consultório"
              />
            </div>
          </div>
        )}

        {/* ── LISTA ── */}
        {view === 'lista' && (
          loading ? (
            <div className="agenda-loading">
              <div className="agenda-loading-spinner" aria-hidden />
              <p>Carregando eventos...</p>
            </div>
          ) : !data?.configured ? (
            <div className="card animate-fade-in-up agenda-empty-state">
              <Calendar size={48} color="var(--luz-gold)" aria-hidden />
              <h3 className="exam-section-title" style={{ marginTop: 12 }}>API não configurada</h3>
              <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, marginTop: 8 }}>
                Configure <code>GOOGLE_CALENDAR_API_KEY</code> no servidor para usar a lista.
              </p>
            </div>
          ) : data?.error ? (
            <div className="card animate-fade-in-up agenda-empty-state">
              <Calendar size={48} color="var(--luz-gold)" aria-hidden />
              <h3 className="exam-section-title" style={{ marginTop: 12 }}>Erro ao carregar</h3>
              <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, marginTop: 8 }}>{data.error}</p>
              <button type="button" className="btn btn-ghost" onClick={fetchEvents} style={{ marginTop: 16 }}>
                Tentar novamente
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="card animate-fade-in-up agenda-empty-state">
              <Calendar size={48} color="var(--luz-gold)" aria-hidden />
              <h3 className="exam-section-title" style={{ marginTop: 12 }}>Nenhum evento nos próximos 14 dias</h3>
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
                          <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                            className="agenda-event-link" aria-label="Abrir no Google Calendar">
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
          )
        )}
      </div>
    </div>
  );
}
