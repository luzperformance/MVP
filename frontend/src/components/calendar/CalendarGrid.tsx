import React, { useMemo } from 'react';
import type { CalendarEventItem } from '@shared/types';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEventItem[];
  today: Date;
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEventItem) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Color cycle for event pills (uses CSS vars)
const EVENT_COLORS = [
  { bg: 'rgba(201,164,74,0.25)', border: 'rgba(201,164,74,0.6)', text: '#d4b55a' },
  { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.5)', text: '#60a5fa' },
  { bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.45)', text: '#4ade80' },
  { bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.45)', text: '#fb923c' },
  { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)', text: '#c084fc' },
];

function getEventColor(eventId: string) {
  // Stable color based on event id
  let hash = 0;
  for (const ch of eventId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function formatPillTime(iso: string, isAllDay: boolean): string {
  if (isAllDay) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(date: Date, isoStr: string): boolean {
  const d = new Date(isoStr);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

export default function CalendarGrid({
  year,
  month,
  events,
  today,
  onDayClick,
  onEventClick,
}: CalendarGridProps) {
  // Build grid days
  const { cells } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    // Pad start
    const cells: (Date | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // Pad end to complete last week row
    while (cells.length % 7 !== 0) cells.push(null);

    return { cells };
  }, [year, month]);

  // Group events by date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of events) {
      const key = ev.start.slice(0, 10);
      (map[key] ??= []).push(ev);
    }
    return map;
  }, [events]);

  const isToday = (date: Date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === month && date.getFullYear() === year;

  return (
    <div className="cal-grid-root">
      {/* Weekday headers */}
      <div className="cal-weekdays">
        {WEEKDAYS.map(d => (
          <div key={d} className="cal-weekday-label">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="cal-cells">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />;
          }

          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateKey] || [];
          const today_ = isToday(date);
          const current = isCurrentMonth(date);

          return (
            <div
              key={dateKey}
              className={`cal-cell${today_ ? ' cal-cell-today' : ''}${current ? '' : ' cal-cell-outside'}`}
              role="button"
              tabIndex={0}
              aria-label={`${date.toLocaleDateString('pt-BR')}${dayEvents.length ? `, ${dayEvents.length} evento(s)` : ''}`}
              onClick={() => onDayClick?.(date)}
              onKeyDown={e => e.key === 'Enter' && onDayClick?.(date)}
            >
              {/* Day number */}
              <div className={`cal-day-number${today_ ? ' cal-day-today' : ''}`}>
                {date.getDate()}
              </div>

              {/* Event pills (max 3 + overflow badge) */}
              <div className="cal-pills">
                {dayEvents.slice(0, 3).map(ev => {
                  const color = getEventColor(ev.id);
                  const time = formatPillTime(ev.start, ev.isAllDay);
                  return (
                    <div
                      key={ev.id}
                      className="cal-event-pill"
                      title={`${time ? time + ' — ' : ''}${ev.summary}`}
                      style={{
                        background: color.bg,
                        border: `1px solid ${color.border}`,
                        color: color.text,
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={e => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onEventClick?.(ev);
                        }
                      }}
                    >
                      {time && <span className="cal-pill-time">{time}</span>}
                      <span className="cal-pill-title">{ev.summary}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="cal-overflow-badge">+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
