import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, FlaskConical, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { TimelineResponse } from '../../shared/types';

const LINE_COLORS = ['#c9a44a','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];

export default function ExamDashboardPage() {
  const { id: patientId } = useParams();
  const { token } = useAuthStore();

  const [data, setData] = useState<TimelineResponse | null>(null);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    const markers = [...selectedMarkers].join(',');
    const url = `/api/patients/${patientId}/exams/timeline${markers ? `?markers=${markers}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [patientId, token, selectedMarkers]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  // Toggle marker selection
  const toggleMarker = (name: string) => {
    setSelectedMarkers(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Transform data for Recharts: array of { date, ...markerValues }
  const chartData = React.useMemo(() => {
    if (!data?.timeline.length) return [];
    const byDate: Record<string, any> = {};
    data.dates.forEach(d => { byDate[d] = { date: d }; });
    data.timeline.forEach(marker => {
      marker.data.forEach(({ date, value }) => {
        if (!byDate[date]) byDate[date] = { date };
        byDate[date][marker.name] = value;
      });
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data]);

  const activeTimeline = data?.timeline.filter(
    m => selectedMarkers.size === 0 || selectedMarkers.has(m.name)
  ) ?? [];

  return (
    <div>
      <div className="page-header">
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <TrendingUp size={18} color="var(--luz-gold)" />
        <span className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', flex: 1, letterSpacing: '0.02em' }}>Dashboard de Exames</span>
      </div>

      <div className="page-content">
        {loading ? (
          <p style={{ color: 'var(--luz-gray-dark)' }}>Carregando exames...</p>
        ) : !data || data.availableMarkers.length === 0 ? (
          <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: 48 }}>
            <FlaskConical size={40} color="var(--luz-gold)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--luz-gray-dark)' }}>Nenhum exame cadastrado ainda.</p>
          </div>
        ) : (
          <div className="stagger stagger-sections">
            {/* Marker filter */}
            <div className="card animate-fade-in-up" style={{ marginBottom: 20 }}>
              <div className="exam-section-label" style={{ marginBottom: 12 }}>
                Selecionar Marcadores
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.availableMarkers.map(({ marker_name, unit }, i) => (
                  <button
                    key={marker_name}
                    onClick={() => toggleMarker(marker_name)}
                    className={`btn btn-sm ${selectedMarkers.has(marker_name) ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderLeft: `3px solid ${LINE_COLORS[i % LINE_COLORS.length]}` }}
                  >
                    {marker_name} ({unit})
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            {activeTimeline.length > 0 && (
              <div className="card animate-fade-in-up" style={{ marginBottom: 20 }}>
                <h3 className="exam-section-title" style={{ marginBottom: 20 }}>
                  Linha do Tempo
                </h3>
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#a0a0a0" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#a0a0a0" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--luz-navy)',
                        border: '1px solid rgba(201,164,74,0.3)',
                        borderRadius: 8,
                        color: 'var(--luz-white)',
                      }}
                    />
                    <Legend />
                    {activeTimeline.map((marker, i) => (
                      <React.Fragment key={marker.name}>
                        {marker.ref_min && <ReferenceLine y={marker.ref_min} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeDasharray="4 4" strokeOpacity={0.4} />}
                        {marker.ref_max && <ReferenceLine y={marker.ref_max} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeDasharray="4 4" strokeOpacity={0.4} />}
                        <Line
                          type="monotone"
                          dataKey={marker.name}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 5, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                          activeDot={{ r: 7 }}
                        />
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary table */}
            <div className="card animate-fade-in-up">
              <h3 className="exam-section-title" style={{ marginBottom: 16 }}>
                Último Resultado por Marcador
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="exam-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Marcador', 'Último Valor', 'Unidade', 'Ref. Lab', 'Ref. Ótima', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--luz-gray-dark)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTimeline.map(marker => {
                      const last = marker.data[marker.data.length - 1];
                      const statusClass = { normal: 'badge-normal', baixo: 'badge-baixo', alto: 'badge-alto', subotimo: 'badge-subotimo', acima_otimo: 'badge-acima_otimo' }[last?.status] || 'badge-normal';
                      return (
                        <tr key={marker.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--luz-white)', fontWeight: 500 }}>{marker.name}</td>
                          <td className="cell-value" style={{ padding: '10px 12px' }}>{last?.value ?? '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--luz-gray-dark)' }}>{marker.unit}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--luz-gray-dark)' }}>
                            {marker.ref_min != null && marker.ref_max != null ? `${marker.ref_min} – ${marker.ref_max}` : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--luz-gray-dark)' }}>
                            {marker.optimal_min != null && marker.optimal_max != null ? `${marker.optimal_min} – ${marker.optimal_max}` : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${statusClass}`}>{last?.status ?? '—'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
