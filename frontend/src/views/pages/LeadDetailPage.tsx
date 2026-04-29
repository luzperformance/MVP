import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, FileText,
  Briefcase, MapPin, Plus, Check, Thermometer, Calendar,
  Zap, AlertCircle, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { Lead, LeadActivity, LeadActivityType, Asset, LeadStatus, LeadSource, LeadTemperature } from '@shared/types';

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo', contato: 'Contato', qualificado: 'Qualificado',
  proposta: 'Proposta', convertido: 'Convertido', perdido: 'Perdido',
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  indicacao: 'Indicação', instagram: 'Instagram', google: 'Google',
  site: 'Site', evento: 'Evento', outro: 'Outro',
};

const TEMP_LABELS: Record<LeadTemperature, string> = {
  frio: 'Frio', morno: 'Morno', quente: 'Quente',
};

const ACTIVITY_TYPE_LABELS: Record<LeadActivityType, string> = {
  nota: 'Nota', ligacao: 'Ligação', email: 'E-mail',
  whatsapp: 'WhatsApp', reuniao: 'Reunião', proposta: 'Proposta', outro: 'Outro',
};

const ACTIVITY_ICONS: Record<LeadActivityType, typeof Phone> = {
  nota: FileText, ligacao: Phone, email: Mail,
  whatsapp: MessageSquare, reuniao: Users, proposta: Briefcase, outro: MapPin,
};

const ALL_ACTIVITY_TYPES: LeadActivityType[] = ['nota', 'ligacao', 'email', 'whatsapp', 'reuniao', 'proposta', 'outro'];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface LeadWithActivities extends Lead {
  activities: LeadActivity[];
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [lead, setLead] = useState<LeadWithActivities | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activityType, setActivityType] = useState<LeadActivityType>('nota');
  const [activityDesc, setActivityDesc] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  const [showConvert, setShowConvert] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [converting, setConverting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; reasoning: string; suggested_temperature?: string; next_action?: string } | null>(null);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resLead, resAssets] = await Promise.all([
        fetch(`/api/leads/${id}`, { headers, signal: controller.signal }),
        fetch(`/api/assets?lead_id=${id}`, { headers, signal: controller.signal }),
      ]);

      if (resLead.status === 401) { logout(); navigate('/login'); return; }
      if (!resLead.ok) { setError('Lead não encontrado.'); return; }

      setLead(await resLead.json());
      if (resAssets.ok) setAssets(await resAssets.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [id, token, logout, navigate]);

  useEffect(() => {
    fetchLead();
    return () => { abortRef.current?.abort(); };
  }, [fetchLead]);

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim()) return;
    setSavingActivity(true);
    try {
      const res = await fetch(`/api/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: activityType, description: activityDesc.trim() }),
      });
      if (res.ok) {
        setActivityDesc('');
        fetchLead();
      }
    } catch { /* ignore */ } finally {
      setSavingActivity(false);
    }
  };

  const convertToPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ birth_date: birthDate }),
      });
      if (res.ok) {
        fetchLead();
        setShowConvert(false);
      }
    } catch { /* ignore */ } finally {
      setConverting(false);
    }
  };

  const scoreLead = async () => {
    if (!id) return;
    setScoring(true);
    try {
      const res = await fetch(`/api/leads/score/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ use_ai: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setScoreResult(data);
        fetchLead();
      }
    } catch { /* ignore */ } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="agenda-loading">
          <div className="agenda-loading-spinner" aria-hidden />
          <p>Carregando lead...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="page-content">
        <div className="card animate-fade-in-up agenda-empty-state">
          <h3 className="exam-section-title">Erro</h3>
          <p style={{ color: 'var(--luz-gray-dark)' }}>{error || 'Lead não encontrado.'}</p>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/crm/leads')} style={{ marginTop: 12 }}>
            <ArrowLeft size={14} aria-hidden /> Voltar para Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/crm/leads')} aria-label="Voltar">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16 }}>
            {lead.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            {lead.company && <>{lead.company} &middot; </>}
            {lead.source && SOURCE_LABELS[lead.source]}
          </div>
        </div>
        <span className={`badge badge-${lead.status}`}>{STATUS_LABELS[lead.status]}</span>
        {lead.temperature && <span className={`badge badge-${lead.temperature}`}>{TEMP_LABELS[lead.temperature]}</span>}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Overdue follow-up warning */}
        {lead.next_followup_at && new Date(lead.next_followup_at).getTime() < Date.now() && lead.status !== 'convertido' && lead.status !== 'perdido' ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 'var(--border-radius-sm)', fontSize: 13,
          }} role="alert">
            <AlertCircle size={16} color="#f87171" aria-hidden />
            <span style={{ color: '#f87171', fontWeight: 600 }}>
              Follow-up atrasado desde {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ) : null}

        {/* Score card */}
        <div className="card animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Zap size={18} color="var(--luz-gold)" aria-hidden />
            <div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Lead Score</div>
              {lead.score != null && lead.score > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 22, fontWeight: 700,
                    color: lead.score >= 75 ? '#4ade80' : lead.score >= 50 ? '#fbbf24' : '#94a3b8',
                  }}>{lead.score}</span>
                  <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>/100</span>
                </div>
              ) : (
                <span style={{ fontSize: 14, color: 'var(--luz-gray-dark)' }}>Não pontuado</span>
              )}
            </div>
          </div>

          {(lead.score_reasoning || scoreResult?.reasoning) ? (
            <div style={{ flex: 2, minWidth: 200, fontSize: 12, color: 'var(--luz-white)', opacity: 0.85, lineHeight: 1.5 }}>
              <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--luz-gold)' }} aria-hidden />
              {scoreResult?.reasoning || lead.score_reasoning}
              {scoreResult?.next_action ? (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--luz-gold)' }}>
                  Ação sugerida: {scoreResult.next_action}
                </div>
              ) : null}
            </div>
          ) : null}

          {lead.status !== 'convertido' && lead.status !== 'perdido' ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={scoreLead} disabled={scoring}>
              <Zap size={14} aria-hidden /> {scoring ? 'Pontuando...' : 'Pontuar com IA'}
            </button>
          ) : null}
        </div>

        {/* Detail card */}
        <div className="card animate-fade-in-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {lead.email && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 2 }}>E-mail</div>
                <div style={{ color: 'var(--luz-white)', fontSize: 14 }}>{lead.email}</div>
              </div>
            )}
            {lead.phone && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 2 }}>Telefone</div>
                <div style={{ color: 'var(--luz-white)', fontSize: 14 }}>{lead.phone}</div>
              </div>
            )}
            {lead.expected_value != null && lead.expected_value > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 2 }}>Valor Esperado</div>
                <div style={{ color: 'var(--luz-gold)', fontSize: 14, fontWeight: 600 }}>{BRL.format(lead.expected_value)}</div>
              </div>
            )}
            {lead.next_followup_at && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 2 }}>Próximo Follow-up</div>
                <div style={{ color: 'var(--luz-white)', fontSize: 14 }}>
                  <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
                  {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>

          {lead.notes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(201,164,74,0.1)' }}>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 4 }}>Notas</div>
              <div style={{ color: 'var(--luz-white)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{lead.notes}</div>
            </div>
          )}

          {/* Converted badge */}
          {lead.status === 'convertido' && lead.patient_id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(201,164,74,0.1)' }}>
              <span className="badge badge-convertido" style={{ marginRight: 8 }}>Convertido</span>
              <Link to={`/patients/${lead.patient_id}`} style={{ color: 'var(--luz-gold)', fontSize: 13 }}>
                Ver paciente &rarr;
              </Link>
            </div>
          )}

          {/* Convert button */}
          {lead.status !== 'convertido' && lead.status !== 'perdido' && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(201,164,74,0.1)' }}>
              {!showConvert ? (
                <button type="button" className="btn btn-success btn-sm" onClick={() => setShowConvert(true)}>
                  <Check size={14} aria-hidden /> Converter em Paciente
                </button>
              ) : (
                <form onSubmit={convertToPatient} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <label htmlFor="convert-birth" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', display: 'block', marginBottom: 4 }}>
                      Data de Nascimento *
                    </label>
                    <input id="convert-birth" type="date" className="form-input" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-success btn-sm" disabled={converting}>
                    {converting ? 'Convertendo...' : 'Confirmar'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowConvert(false)}>Cancelar</button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Activities */}
        <div className="card animate-fade-in-up">
          <h3 className="exam-section-title" style={{ marginBottom: 16 }}>
            <Thermometer size={16} color="var(--luz-gold)" aria-hidden style={{ marginRight: 6 }} />
            Atividades
          </h3>

          {/* New activity form */}
          <form onSubmit={addActivity} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select className="form-input" value={activityType} onChange={e => setActivityType(e.target.value as LeadActivityType)} style={{ width: 'auto', minWidth: 120 }}>
              {ALL_ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
            </select>
            <input
              className="form-input"
              placeholder="Descrição da atividade..."
              value={activityDesc}
              onChange={e => setActivityDesc(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingActivity || !activityDesc.trim()}>
              <Plus size={14} aria-hidden /> Adicionar
            </button>
          </form>

          {/* Timeline */}
          {lead.activities.length === 0 ? (
            <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Nenhuma atividade registrada.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lead.activities.map(act => {
                const Icon = ACTIVITY_ICONS[act.type] || FileText;
                return (
                  <div key={act.id} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    paddingLeft: 8, borderLeft: '2px solid rgba(201,164,74,0.2)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(201,164,74,0.12)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color="var(--luz-gold)" aria-hidden />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-white)' }}>
                          {ACTIVITY_TYPE_LABELS[act.type]}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>
                          {new Date(act.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--luz-white)', opacity: 0.85 }}>
                        {act.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assets linked to lead */}
        <div className="card animate-fade-in-up">
          <h3 className="exam-section-title" style={{ marginBottom: 16 }}>
            Ativos Vinculados
          </h3>

          {assets.length === 0 ? (
            <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Nenhum ativo vinculado a este lead.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assets.map(asset => (
                <div key={asset.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(201,164,74,0.08)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--luz-white)', fontSize: 14 }}>{asset.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
                      {asset.type} &middot; {asset.status}
                    </div>
                  </div>
                  {asset.value != null && asset.value > 0 && (
                    <div style={{ color: 'var(--luz-gold)', fontWeight: 600, fontSize: 13 }}>
                      {BRL.format(asset.value)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
