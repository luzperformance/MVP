import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  RefreshCw, Link2, Search, Bell, Activity,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import EventFormModal from '../../components/calendar/EventFormModal';
import type { CalendarEventsResponse, CalendarEventItem } from '@shared/types';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function AgendaPage() {
  const token = useAuthStore(s => s.token);
  const doctor = useAuthStore(s => s.doctor);
  const canEdit = !!doctor?.can_edit_agenda;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [data, setData] = useState<CalendarEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{ connected: boolean; oauthConfigured: boolean } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const timeMin = new Date(viewYear, viewMonth, 1).toISOString();
      const timeMax = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal },
      );
      if (!res.ok) { setData({ configured: false, events: [] }); return; }
      setData(await res.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setData({ configured: false, events: [] });
    } finally {
      setLoading(false);
    }
  }, [token, viewYear, viewMonth]);

  const fetchOAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/oauth/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOauthStatus(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { fetchEvents(); fetchOAuthStatus(); return () => { abortRef.current?.abort(); }; }, [fetchEvents, fetchOAuthStatus]);

  const navigateMonth = (dir: -1 | 1) => {
    const d = new Date(viewYear, viewMonth + dir, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleDayClick = (date: Date) => {
    if (!canEdit) return;
    setNewEventDate(date);
    setCreateOpen(true);
  };

  const handleEventCreated = () => {
    fetchEvents();
  };

  const modalPrefill = newEventDate
    ? {
        startDateTime: (() => {
          const d = new Date(newEventDate);
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        })(),
        endDateTime: (() => {
          const d = new Date(newEventDate);
          d.setHours(10, 0, 0, 0);
          return d.toISOString();
        })(),
      }
    : undefined;

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0e14] text-slate-100 font-sans relative overflow-hidden" style={{ height: 'calc(100vh - var(--header-height, 0px))', margin: '-24px', width: 'auto' }}>
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#2b8cee]/15 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex-none h-16 w-full flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-[20px] z-50">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 text-[#2b8cee] flex items-center justify-center bg-[#2b8cee]/10 rounded-lg">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white/90">Agenda Inteligente</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold flex items-center gap-2">
              Visão Mensal
              {oauthStatus?.connected && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sync Button */}
          <button
            type="button"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            onClick={fetchEvents}
            disabled={loading}
            title="Sincronizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* OAuth Connect */}
          {oauthStatus && oauthStatus.oauthConfigured && !oauthStatus.connected && canEdit && (
            <a
              href="/api/calendar/oauth/url"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors"
            >
              <Link2 size={14} />
              Conectar Google
            </a>
          )}

          {canEdit && (
            <button
              onClick={() => { setNewEventDate(null); setCreateOpen(true); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#2b8cee] hover:bg-blue-500 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(43,140,238,0.3)] transition-all"
            >
              <Plus size={14} />
              Novo Evento
            </button>
          )}

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Search size={18} />
            </button>
            <button className="h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-[#2b8cee]"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 z-0 overflow-hidden">
        
        {/* Month Navigation */}
        <div className="flex-none flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
              {MONTHS_PT[viewMonth]}
              <span className="text-white/30 ml-3 font-normal">{viewYear}</span>
            </h2>
            <button
              type="button"
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/70 transition-colors"
              onClick={goToToday}
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar Glass Panel */}
        <div className="flex-1 min-h-0 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col calendar-glass-container">
          {loading ? (
            <div className="flex-1 p-6 grid grid-cols-7 grid-rows-5 gap-4">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : !data?.configured ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center mb-6">
                <p className="text-sm text-white/50">
                  {oauthStatus && oauthStatus.oauthConfigured && canEdit
                    ? 'Conecte sua conta Google para visualizar eventos'
                    : 'Agenda não configurada'
                  }
                </p>
              </div>
              {oauthStatus && oauthStatus.oauthConfigured && canEdit && (
                <a
                  href="/api/calendar/oauth/url"
                  className="flex items-center gap-2 px-4 py-2 bg-[#2b8cee] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Link2 size={14} />
                  Conectar Google Calendar
                </a>
              )}
            </div>
          ) : data.events.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <p className="text-sm text-white/50">
                Ainda não possuem consultas registradas
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 relative z-10 w-full h-full p-2 lg:p-4 pb-0 grid-container">
              <CalendarGrid
                year={viewYear}
                month={viewMonth}
                events={data.events}
                today={today}
                onDayClick={handleDayClick}
                onEventClick={setSelectedEvent}
              />
            </div>
          )}
        </div>
      </main>

      {/* Deep Stylings injected specifically for the CalendarGrid inside this page */}
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-glass-container .cal-grid-root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .calendar-glass-container .cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .calendar-glass-container .cal-weekday-label {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.4);
        }
        .calendar-glass-container .cal-cells {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          grid-auto-rows: minmax(80px, 1fr);
          background: transparent;
          gap: 1px;
          border: none;
        }
        .calendar-glass-container .cal-cell {
          background: rgba(255, 255, 255, 0.01);
          padding: 8px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 12px;
          border: 1px solid transparent;
          box-sizing: border-box;
          margin: 3px;
        }
        .calendar-glass-container .cal-cell:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .calendar-glass-container .cal-cell-empty {
          background: transparent;
          pointer-events: none;
        }
        .calendar-glass-container .cal-cell-outside {
          opacity: 0.3;
        }
        .calendar-glass-container .cal-cell-today {
          background: rgba(43, 140, 238, 0.08);
          border-color: rgba(43, 140, 238, 0.2);
        }
        .calendar-glass-container .cal-day-number {
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .calendar-glass-container .cal-day-today {
          background: #2b8cee;
          color: #fff;
          box-shadow: 0 0 10px rgba(43, 140, 238, 0.4);
        }
        .calendar-glass-container .cal-pills {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .calendar-glass-container .cal-event-pill {
          font-size: 0.65rem;
          padding: 3px 6px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 600;
          transition: all 0.2s;
          backdrop-filter: blur(5px);
        }
        .calendar-glass-container .cal-event-pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.2);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .calendar-glass-container .cal-pill-time {
          opacity: 0.8;
          margin-right: 4px;
          font-weight: 700;
        }
        .calendar-glass-container .cal-overflow-badge {
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          padding-top: 2px;
          padding-left: 2px;
        }
      `}} />

      {createOpen && canEdit && (
        <EventFormModal
          isOpen={createOpen}
          onClose={() => { setCreateOpen(false); setNewEventDate(null); }}
          onSuccess={handleEventCreated}
          prefill={modalPrefill}
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#121822] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-white/40 hover:text-white"
              onClick={() => setSelectedEvent(null)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1 pr-8">{selectedEvent.summary}</h3>
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center gap-3 text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="h-8 w-8 rounded-lg bg-[#2b8cee]/20 border border-[#2b8cee]/30 flex items-center justify-center text-[#2b8cee]">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-white/30">Horário</div>
                  <div className="text-sm font-medium">
                    {selectedEvent.isAllDay ? 'Dia Inteiro' : (
                      <>
                        {new Date(selectedEvent.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        <span className="opacity-50 mx-1">até</span>
                        {new Date(selectedEvent.end).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="text-sm text-white/50 bg-black/30 p-4 rounded-xl border border-white/5">
                  {selectedEvent.description.split('\n').map((l, i) => (
                    <React.Fragment key={i}>{l}<br/></React.Fragment>
                  ))}
                </div>
              )}

              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-2.5 rounded-xl border border-[#2b8cee]/30 text-[#2b8cee] hover:bg-[#2b8cee]/10 flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                >
                  <Link2 size={16} />
                  Ver no Google Calendar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
