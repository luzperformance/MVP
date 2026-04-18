import React, { useState, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, FileText, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { CreateCalendarEventDTO } from '@shared/types';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (htmlLink?: string) => void;
  /** Pre-populate fields from prontuário context */
  prefill?: Partial<CreateCalendarEventDTO>;
}

function toLocalDatetimeInput(iso?: string): string {
  if (!iso) {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return now.toISOString().slice(0, 16);
  }
  return new Date(iso).toISOString().slice(0, 16);
}

function addHour(datetimeLocal: string): string {
  const d = new Date(datetimeLocal);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

type Status = 'idle' | 'loading' | 'success' | 'error' | 'needs_auth';

export default function EventFormModal({ isOpen, onClose, onSuccess, prefill }: EventFormModalProps) {
  const token = useAuthStore(s => s.token);

  const defaultStart = toLocalDatetimeInput(prefill?.startDateTime);
  const defaultEnd = prefill?.endDateTime
    ? toLocalDatetimeInput(prefill.endDateTime)
    : addHour(defaultStart);

  const [summary, setSummary] = useState(prefill?.summary || '');
  const [startDt, setStartDt] = useState(defaultStart);
  const [endDt, setEndDt] = useState(defaultEnd);
  const [location, setLocation] = useState(prefill?.location || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [createdLink, setCreatedLink] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !startDt || !endDt) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const body: CreateCalendarEventDTO = {
        summary: summary.trim(),
        startDateTime: new Date(startDt).toISOString(),
        endDateTime: new Date(endDt).toISOString(),
        ...(location ? { location } : {}),
        ...(description ? { description } : {}),
        ...(prefill?.patientName ? { patientName: prefill.patientName } : {}),
      };

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 403 && data.requiresAuth) {
        setAuthUrl(data.authUrl || '');
        setStatus('needs_auth');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar evento.');
      }

      setCreatedLink(data.htmlLink || '');
      setStatus('success');
      onSuccess?.(data.htmlLink);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro desconhecido.');
      setStatus('error');
    }
  }, [summary, startDt, endDt, location, description, prefill, token, onSuccess]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    setErrorMsg('');
    setAuthUrl('');
    setCreatedLink('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="cal-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div className="cal-modal-box animate-fade-in-up">
        {/* ── Header ── */}
        <div className="cal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="cal-modal-icon">
              <Calendar size={16} />
            </div>
            <h2 id="event-modal-title" className="cal-modal-title">
              {prefill?.patientName ? `Agendar — ${prefill.patientName}` : 'Novo Evento'}
            </h2>
          </div>
          <button
            type="button"
            className="cal-modal-close"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── States ── */}
        {status === 'success' && (
          <div className="cal-modal-state">
            <CheckCircle2 size={48} color="var(--luz-success)" />
            <h3 style={{ color: 'var(--luz-white)', margin: '12px 0 8px' }}>Evento criado!</h3>
            <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13 }}>
              O evento foi adicionado ao Google Calendar.
            </p>
            {createdLink && (
              <a
                href={createdLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ marginTop: 16, fontSize: 13 }}
              >
                Abrir no Google Calendar
              </a>
            )}
            <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleClose}>
              Fechar
            </button>
          </div>
        )}

        {status === 'needs_auth' && (
          <div className="cal-modal-state">
            <AlertCircle size={48} color="var(--luz-warning)" />
            <h3 style={{ color: 'var(--luz-white)', margin: '12px 0 8px' }}>Autorização necessária</h3>
            <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, maxWidth: 300, textAlign: 'center' }}>
              Para criar eventos, autorize o acesso ao Google Calendar.
            </p>
            {authUrl && (
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                Autorizar Google Calendar
              </a>
            )}
            <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={handleClose}>
              Cancelar
            </button>
          </div>
        )}

        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <form onSubmit={handleSubmit} className="cal-modal-form">
            {/* Summary */}
            <div className="cal-form-field">
              <label className="form-label" htmlFor="ev-summary">
                <FileText size={12} style={{ marginRight: 4 }} />
                Título do Evento
              </label>
              <input
                id="ev-summary"
                className="form-input"
                type="text"
                placeholder="Ex: Consulta Inicial — Nome do Paciente"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                required
                disabled={status === 'loading'}
              />
            </div>

            {/* Patient info (display only) */}
            {prefill?.patientName && (
              <div className="cal-form-field">
                <label className="form-label">
                  <User size={12} style={{ marginRight: 4 }} />
                  Paciente
                </label>
                <div className="cal-form-readonly">{prefill.patientName}</div>
              </div>
            )}

            {/* Date/Time row */}
            <div className="cal-form-row">
              <div className="cal-form-field" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="ev-start">
                  <Clock size={12} style={{ marginRight: 4 }} />
                  Início
                </label>
                <input
                  id="ev-start"
                  className="form-input"
                  type="datetime-local"
                  value={startDt}
                  onChange={e => {
                    setStartDt(e.target.value);
                    if (!endDt || endDt <= e.target.value) {
                      setEndDt(addHour(e.target.value));
                    }
                  }}
                  required
                  disabled={status === 'loading'}
                />
              </div>
              <div className="cal-form-field" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="ev-end">
                  <Clock size={12} style={{ marginRight: 4 }} />
                  Fim
                </label>
                <input
                  id="ev-end"
                  className="form-input"
                  type="datetime-local"
                  value={endDt}
                  min={startDt}
                  onChange={e => setEndDt(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            {/* Location */}
            <div className="cal-form-field">
              <label className="form-label" htmlFor="ev-location">
                <MapPin size={12} style={{ marginRight: 4 }} />
                Local (opcional)
              </label>
              <input
                id="ev-location"
                className="form-input"
                type="text"
                placeholder="Ex: Consultório Luz Performance"
                value={location}
                onChange={e => setLocation(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            {/* Description */}
            <div className="cal-form-field">
              <label className="form-label" htmlFor="ev-desc">
                <FileText size={12} style={{ marginRight: 4 }} />
                描述/Observações (opcional)
              </label>
              <textarea
                id="ev-desc"
                className="form-input"
                placeholder="Detalhes adicionais..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={status === 'loading'}
                rows={3}
              />
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="cal-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClose}
                disabled={status === 'loading'}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading' || !summary.trim()}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="cal-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Criar Evento
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
