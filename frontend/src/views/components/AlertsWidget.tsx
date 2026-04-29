import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, Calendar, FileText, Users, CreditCard,
  ChevronRight, X, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { Alert, AlertsSummary, AlertSeverity } from '@shared/types';

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: 'rgba(239,68,68,0.15)',
  high: 'rgba(249,115,22,0.12)',
  medium: 'rgba(234,179,8,0.10)',
  low: 'rgba(34,197,94,0.08)',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  patient_inactive: <Users size={14} />,
  contract_expiring: <FileText size={14} />,
  exam_overdue: <AlertTriangle size={14} />,
  lead_hot_no_followup: <Bell size={14} />,
  payment_overdue: <CreditCard size={14} />,
  consultation_today: <Calendar size={14} />,
};

export default function AlertsWidget() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const hdrs = { Authorization: `Bearer ${token}` };
      const sig = controller.signal;

      const [resAlerts, resSummary] = await Promise.all([
        fetch('/api/alerts', { headers: hdrs, signal: sig }),
        fetch('/api/alerts/summary', { headers: hdrs, signal: sig }),
      ]);

      if (resAlerts.status === 401 || resSummary.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (resAlerts.ok) setAlerts(await resAlerts.json());
      if (resSummary.ok) setSummary(await resSummary.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchAlerts();
    return () => { abortRef.current?.abort(); };
  }, [fetchAlerts]);

  const visibleAlerts = expanded ? alerts : alerts.slice(0, 5);
  const hasMore = alerts.length > 5;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(201,164,74,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--luz-gold)" />
          <span className="font-display" style={{ fontWeight: 700, fontSize: 14, color: 'var(--luz-white)' }}>
            Alertas
          </span>
          {summary && summary.total > 0 ? (
            <span style={{
              background: summary.critical > 0 ? SEVERITY_COLORS.critical : SEVERITY_COLORS.high,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 10,
            }}>
              {summary.total}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={fetchAlerts}
          disabled={loading}
          style={{ padding: '4px 8px' }}
          title="Atualizar"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ maxHeight: expanded ? 400 : 280, overflowY: 'auto' }}>
        {loading && alerts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--luz-gray-dark)' }}>
            Carregando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>&#10003;</div>
            <div style={{ color: '#4ade80', fontWeight: 600, fontSize: 13 }}>Tudo em dia!</div>
            <div style={{ color: 'var(--luz-gray-dark)', fontSize: 11, marginTop: 4 }}>
              Nenhum alerta pendente
            </div>
          </div>
        ) : (
          visibleAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => navigate(alert.action_url)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                cursor: 'pointer',
                background: SEVERITY_BG[alert.severity],
                borderLeft: `3px solid ${SEVERITY_COLORS[alert.severity]}`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,164,74,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = SEVERITY_BG[alert.severity])}
            >
              <div style={{ color: SEVERITY_COLORS[alert.severity], marginTop: 2 }}>
                {TYPE_ICONS[alert.type] || <Bell size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-white)', marginBottom: 2 }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', lineHeight: 1.3 }}>
                  {alert.description}
                </div>
              </div>
              <ChevronRight size={14} color="var(--luz-gray-dark)" style={{ marginTop: 4 }} />
            </div>
          ))
        )}
      </div>

      {hasMore ? (
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '10px 16px',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--luz-gold)',
            fontWeight: 600,
          }}
        >
          {expanded ? 'Mostrar menos' : `Ver todos (${alerts.length})`}
        </div>
      ) : null}

      {summary ? (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)',
          flexWrap: 'wrap',
        }}>
          {summary.by_type.consultation_today > 0 ? (
            <MiniStat label="Consultas hoje" value={summary.by_type.consultation_today} color="#22c55e" />
          ) : null}
          {summary.by_type.contract_expiring > 0 ? (
            <MiniStat label="Contratos vencendo" value={summary.by_type.contract_expiring} color="#ef4444" />
          ) : null}
          {summary.by_type.payment_overdue > 0 ? (
            <MiniStat label="Pagamentos" value={summary.by_type.payment_overdue} color="#f97316" />
          ) : null}
          {summary.by_type.lead_hot_no_followup > 0 ? (
            <MiniStat label="Leads quentes" value={summary.by_type.lead_hot_no_followup} color="#eab308" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      padding: '4px 8px',
      borderRadius: 6,
      fontSize: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{ color: 'var(--luz-gray-dark)' }}>{label}:</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
