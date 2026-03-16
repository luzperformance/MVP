import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Clock, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { ConsultaListItem } from '../../shared/types';

const TYPE_LABELS: Record<ConsultaListItem['type'], string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  exame: 'Exame',
  procedimento: 'Procedimento',
  teleconsulta: 'Teleconsulta',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupByDate(items: ConsultaListItem[]): { date: string; label: string; items: ConsultaListItem[] }[] {
  const byDate: Record<string, ConsultaListItem[]> = {};
  items.forEach(item => {
    const d = item.consultation_date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(item);
  });
  return Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      label: formatDate(date),
      items: byDate[date],
    }));
}

export default function ConsultasPage() {
  const { token } = useAuthStore();
  const [list, setList] = useState<ConsultaListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consultas?limit=80', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setList(Array.isArray(json) ? json : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchConsultas(); }, [fetchConsultas]);

  const grouped = list.length > 0 ? groupByDate(list) : [];

  return (
    <div className="agenda-page">
      <div className="page-header">
        <Stethoscope size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Consultas
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            Registros de consultas, retornos e procedimentos
          </div>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando consultas...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Stethoscope size={48} color="var(--luz-gold)" className="agenda-empty-icon" aria-hidden />
            <h3 className="exam-section-title">Nenhuma consulta registrada</h3>
            <p>Os registros de consulta aparecerão aqui. Cadastre pacientes e adicione anamneses em <Link to="/patients" className="login-setup-link">Pacientes</Link>.</p>
          </div>
        ) : (
          <div className="stagger stagger-sections agenda-content">
            {grouped.map(({ date, label, items }) => (
              <div key={date} className="card animate-fade-in-up agenda-day-card">
                <div className="agenda-day-label">{label}</div>
                <ul className="agenda-event-list">
                  {items.map(item => (
                    <li key={item.id} className="agenda-event-item">
                      <Link
                        to={`/patients/${item.patient_id}`}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        aria-label={`Ver paciente ${item.patient_name}`}
                      >
                        <div className="agenda-event-time">
                          <span className="badge badge-baixo">{TYPE_LABELS[item.type]}</span>
                          {item.duration_minutes != null && (
                            <>
                              <Clock size={14} aria-hidden />
                              {item.duration_minutes} min
                            </>
                          )}
                        </div>
                        <div className="agenda-event-summary">
                          {item.patient_name}
                        </div>
                        <div className="agenda-event-meta" style={{ justifyContent: 'flex-end' }}>
                          <User size={12} aria-hidden />
                          Ver prontuário
                          <ChevronRight size={14} aria-hidden />
                        </div>
                      </Link>
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
