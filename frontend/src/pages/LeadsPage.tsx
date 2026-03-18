import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Plus, Search, ChevronRight, X, Calendar, Upload, LayoutGrid, List, FileText, TrendingUp, AlertTriangle, Zap, BarChart3, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { Lead, LeadSource, LeadStatus, LeadTemperature, CrmSummary } from '@shared/types';

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

const ALL_STATUSES: LeadStatus[] = ['novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido'];
const ALL_SOURCES: LeadSource[] = ['indicacao', 'instagram', 'google', 'site', 'evento', 'outro'];
const ALL_TEMPS: LeadTemperature[] = ['frio', 'morno', 'quente'];
const KANBAN_COLS: LeadStatus[] = ['novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido'];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type ViewMode = 'list' | 'kanban';

export default function LeadsPage() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<CrmSummary | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [hygiene, setHygiene] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const fetchLeads = useCallback(async (q?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (filterStatus && viewMode !== 'kanban') params.set('status', filterStatus);
      const qs = params.toString() ? `?${params}` : '';

      const hdrs = { Authorization: `Bearer ${token}` };
      const sig = controller.signal;

      const [resLeads, resSummary, resAnalytics, resHygiene] = await Promise.all([
        fetch(`/api/leads${qs}`, { headers: hdrs, signal: sig }),
        fetch('/api/leads/summary', { headers: hdrs, signal: sig }),
        fetch('/api/leads/analytics', { headers: hdrs, signal: sig }),
        fetch('/api/leads/hygiene', { headers: hdrs, signal: sig }),
      ]);

      if (resLeads.status === 401 || resSummary.status === 401) { logout(); navigate('/login'); return; }
      if (!resLeads.ok) { setError('Erro ao carregar leads.'); setLeads([]); return; }

      const data = await resLeads.json();
      setLeads(Array.isArray(data) ? data : []);
      if (resSummary.ok) setSummary(await resSummary.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resHygiene.ok) setHygiene(await resHygiene.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão com o servidor.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate, filterStatus, viewMode]);

  useEffect(() => {
    fetchLeads();
    return () => { abortRef.current?.abort(); };
  }, [fetchLeads]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(search);
  };

  return (
    <div>
      <div className="page-header">
        <UserPlus size={20} color="var(--luz-gold)" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Leads
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowImportModal(true)} aria-label="Importar leads" title="Importar CSV/JSON">
            <Upload size={16} aria-hidden /> Importar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNewModal(true)} aria-label="Novo Lead">
            <Plus size={16} aria-hidden /> Novo Lead
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* KPI cards */}
        {summary && <KpiCards summary={summary} analytics={analytics} hygiene={hygiene} />}

        {/* View mode toggle + search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid rgba(201,164,74,0.2)' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              aria-label="Visualização em lista"
              style={{ borderRadius: 0, border: 'none' }}
            >
              <List size={14} aria-hidden /> Lista
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('kanban')}
              aria-label="Visualização Kanban"
              style={{ borderRadius: 0, border: 'none' }}
            >
              <LayoutGrid size={14} aria-hidden /> Kanban
            </button>
          </div>

          {viewMode === 'list' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus('')}>Todos</button>
              {ALL_STATUSES.map(s => (
                <button key={s} type="button" className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus(s)}>{STATUS_LABELS[s]}</button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou empresa..." style={{ flex: 1 }} aria-label="Buscar lead" />
          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Buscar"><Search size={16} aria-hidden /> Buscar</button>
        </form>

        {/* Content */}
        {loading ? (
          <div className="agenda-loading"><div className="agenda-loading-spinner" aria-hidden /><p>Carregando leads...</p></div>
        ) : error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <UserPlus size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>{error}</p>
            <button type="button" className="btn btn-ghost" onClick={() => fetchLeads()} style={{ marginTop: 12 }}>Tentar novamente</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <UserPlus size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhum lead cadastrado</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>Comece cadastrando ou importando leads para gerenciar o funil.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowNewModal(true)}><Plus size={16} aria-hidden /> Criar lead</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowImportModal(true)}><Upload size={16} aria-hidden /> Importar</button>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard leads={leads} />
        ) : (
          <LeadList leads={leads} />
        )}
      </div>

      {showNewModal && <NewLeadModal token={token} onClose={() => setShowNewModal(false)} onCreated={() => { setShowNewModal(false); fetchLeads(); }} />}
      {showImportModal && <ImportModal token={token} onClose={() => setShowImportModal(false)} onImported={() => { setShowImportModal(false); fetchLeads(); }} />}
    </div>
  );
}

// ── KPI Cards ──
function KpiCards({ summary, analytics, hygiene }: { summary: CrmSummary; analytics?: any; hygiene?: any }) {
  const funnelData = summary.byStatus.filter(s => !['convertido', 'perdido'].includes(s.status));
  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Top KPIs row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--luz-gold)' }}>{summary.totalLeads}</div>
          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>Total Leads</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--luz-gold)' }}>{BRL.format(summary.pipelineValue)}</div>
          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>Pipeline</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>{summary.convertedThisMonth}</div>
          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>Convertidos mês</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: summary.pendingFollowups > 0 ? '#f87171' : '#fb923c' }}>{summary.pendingFollowups}</div>
          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>
            {summary.pendingFollowups > 0 && <AlertCircle size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} aria-hidden />}
            Follow-ups
          </div>
        </div>
        {analytics && (
          <>
            <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>{analytics.conversionRate}%</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>
                <TrendingUp size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} aria-hidden />
                Conversão
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--luz-gold)' }}>{analytics.avgDaysToConvert}d</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>Tempo médio</div>
            </div>
          </>
        )}
      </div>

      {/* Hygiene alert banner */}
      {hygiene && hygiene.healthScore < 70 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 'var(--border-radius-sm)', marginBottom: 16, fontSize: 13,
        }}>
          <AlertTriangle size={16} color="#fbbf24" aria-hidden />
          <span style={{ color: 'var(--luz-white)' }}>
            Saúde do pipeline: <strong style={{ color: hygiene.healthScore < 40 ? '#f87171' : '#fbbf24' }}>{hygiene.healthScore}/100</strong>
            {hygiene.overdueFollowups.count > 0 && <> &middot; {hygiene.overdueFollowups.count} follow-ups atrasados</>}
            {hygiene.staleLeads.count > 0 && <> &middot; {hygiene.staleLeads.count} leads parados</>}
            {hygiene.noActivity.count > 0 && <> &middot; {hygiene.noActivity.count} sem atividade</>}
          </span>
        </div>
      )}

      {/* Funnel + sources + top sources conversion */}
      <div style={{ display: 'grid', gridTemplateColumns: analytics ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-gray-dark)', marginBottom: 12 }}>FUNIL</div>
          {funnelData.map(s => (
            <div key={s.status} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: 'var(--luz-white)' }}>{STATUS_LABELS[s.status as LeadStatus]}</span>
                <span style={{ color: 'var(--luz-gold)', fontWeight: 600 }}>{s.count}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(201,164,74,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(s.count / maxCount) * 100}%`, borderRadius: 3 }} className="crm-funnel-bar" />
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-gray-dark)', marginBottom: 12 }}>ORIGENS</div>
          {(analytics?.topSources || summary.bySource).map((s: any) => (
            <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid rgba(201,164,74,0.06)' }}>
              <span style={{ color: 'var(--luz-white)' }}>{SOURCE_LABELS[s.source as LeadSource] || s.source}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--luz-gold)', fontWeight: 600 }}>{s.total || s.count}</span>
                {s.conversion_rate != null && (
                  <span style={{ fontSize: 10, color: s.conversion_rate > 0 ? '#4ade80' : 'var(--luz-gray-dark)' }}>
                    {s.conversion_rate}%
                  </span>
                )}
              </span>
            </div>
          ))}
          {summary.bySource.length === 0 && <p style={{ color: 'var(--luz-gray-dark)', fontSize: 12, textAlign: 'center' }}>Sem dados</p>}
        </div>
        {analytics?.byTemperature && (
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-gray-dark)', marginBottom: 12 }}>TEMPERATURA</div>
            {analytics.byTemperature.map((t: any) => (
              <div key={t.temperature} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(201,164,74,0.06)' }}>
                <span className={`badge badge-${t.temperature}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                  {TEMP_LABELS[t.temperature as LeadTemperature]}
                </span>
                <span style={{ color: 'var(--luz-white)', fontWeight: 600 }}>{t.count}</span>
              </div>
            ))}
            {analytics.avgScore > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(201,164,74,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Score médio</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--luz-gold)' }}>
                  <Zap size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
                  {analytics.avgScore}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Board ──
function KanbanBoard({ leads }: { leads: Lead[] }) {
  const now = Date.now();
  const grouped = KANBAN_COLS.reduce((acc, status) => {
    acc[status] = leads.filter(l => l.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  return (
    <div className="crm-kanban-container">
      {KANBAN_COLS.map(status => {
        const colLeads = grouped[status];
        const colValue = colLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0);

        return (
          <div key={status} className="crm-kanban-column">
            <div className="crm-kanban-header">
              <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
              <span style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginLeft: 6 }}>{colLeads.length}</span>
              {colValue > 0 ? (
                <span style={{ fontSize: 10, color: 'var(--luz-gold)', marginLeft: 'auto', fontWeight: 600 }}>{BRL.format(colValue)}</span>
              ) : null}
            </div>
            <div className="crm-kanban-cards">
              {colLeads.map(lead => {
                const isOverdue = lead.next_followup_at ? new Date(lead.next_followup_at).getTime() < now : false;

                return (
                  <Link key={lead.id} to={`/crm/leads/${lead.id}`} className="crm-kanban-card card" aria-label={`Ver ${lead.name}`} style={{ borderLeft: isOverdue ? '3px solid #f87171' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, color: 'var(--luz-white)', fontSize: 13 }}>{lead.name}</div>
                      {lead.score != null && lead.score > 0 ? (
                        <span style={{
                          fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '1px 5px',
                          background: lead.score >= 75 ? '#4ade80' : lead.score >= 50 ? '#fbbf24' : '#94a3b8',
                          color: '#0a0a0f',
                        }} title={`Score: ${lead.score}`}>{lead.score}</span>
                      ) : null}
                    </div>
                    {lead.company ? <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>{lead.company}</div> : null}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {lead.temperature ? <span className={`badge badge-${lead.temperature}`} style={{ fontSize: 9, padding: '2px 6px' }}>{TEMP_LABELS[lead.temperature]}</span> : null}
                      {lead.expected_value != null && lead.expected_value > 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--luz-gold)', fontWeight: 600 }}>{BRL.format(lead.expected_value)}</span>
                      ) : null}
                    </div>
                    {lead.next_followup_at ? (
                      <div style={{ fontSize: 10, color: isOverdue ? '#f87171' : 'var(--luz-gray-dark)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {isOverdue ? <AlertCircle size={10} aria-hidden /> : <Calendar size={10} aria-hidden />}
                        {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
                        {isOverdue ? ' (atrasado)' : ''}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
              {colLeads.length === 0 ? <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--luz-gray-dark)' }}>Vazio</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Lead List (original view) ──
function LeadList({ leads }: { leads: Lead[] }) {
  const now = Date.now();

  return (
    <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {leads.map(lead => {
        const isOverdue = lead.next_followup_at ? new Date(lead.next_followup_at).getTime() < now : false;

        return (
          <Link key={lead.id} to={`/crm/leads/${lead.id}`} className="card animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', borderLeft: isOverdue ? '3px solid #f87171' : undefined }} aria-label={`Ver lead ${lead.name}`}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,164,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Orbitron', fontWeight: 700, position: 'relative' }} className="font-display" aria-hidden>
              {lead.name.charAt(0).toUpperCase()}
              {lead.score != null && lead.score > 0 ? (
                <span style={{
                  position: 'absolute', bottom: -4, right: -4, fontSize: 9, fontWeight: 700,
                  background: lead.score >= 75 ? '#4ade80' : lead.score >= 50 ? '#fbbf24' : '#94a3b8',
                  color: '#0a0a0f', borderRadius: 8, padding: '1px 5px', fontFamily: 'sans-serif',
                }} title={`Score: ${lead.score}`}>{lead.score}</span>
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: 'var(--luz-white)' }}>{lead.name}</span>
                <span className={`badge badge-${lead.status}`}>{STATUS_LABELS[lead.status]}</span>
                {lead.temperature ? <span className={`badge badge-${lead.temperature}`}>{TEMP_LABELS[lead.temperature]}</span> : null}
                {isOverdue ? (
                  <span style={{ fontSize: 10, color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <AlertCircle size={10} aria-hidden /> Atrasado
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
                {lead.company ? <>{lead.company} &middot; </> : null}
                {lead.source ? <>{SOURCE_LABELS[lead.source]} &middot; </> : null}
                {lead.expected_value ? BRL.format(lead.expected_value) : ''}
                {lead.next_followup_at ? (
                  <span style={{ marginLeft: 6, color: isOverdue ? '#f87171' : undefined }}>
                    <Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} aria-hidden />
                    {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronRight size={16} color="var(--luz-gray-dark)" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}

// ── New Lead Modal ──
interface ModalProps { token: string | null; onClose: () => void; onCreated: () => void; }

function NewLeadModal({ token, onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: '' as LeadSource | '', temperature: 'morno' as LeadTemperature, expected_value: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { setError('Nome deve ter pelo menos 2 caracteres.'); return; }
    setSaving(true); setError('');
    try {
      const body: { [k: string]: unknown } = { name: form.name.trim(), temperature: form.temperature };
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.company) body.company = form.company;
      if (form.source) body.source = form.source;
      if (form.expected_value) body.expected_value = Number(form.expected_value);
      if (form.notes) body.notes = form.notes;
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error || 'Erro ao criar lead.'); return; }
      onCreated();
    } catch { setError('Erro de conexão.'); } finally { setSaving(false); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--luz-white)', margin: 0 }}>Novo Lead</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} aria-hidden /></button>
      </div>
      {error && <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label htmlFor="lead-name" className="form-label-sm">Nome *</label><input id="lead-name" name="name" className="form-input" value={form.name} onChange={handleChange} required autoFocus /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label htmlFor="lead-email" className="form-label-sm">E-mail</label><input id="lead-email" name="email" type="email" className="form-input" value={form.email} onChange={handleChange} /></div>
          <div><label htmlFor="lead-phone" className="form-label-sm">Telefone</label><input id="lead-phone" name="phone" className="form-input" value={form.phone} onChange={handleChange} /></div>
        </div>
        <div><label htmlFor="lead-company" className="form-label-sm">Empresa</label><input id="lead-company" name="company" className="form-input" value={form.company} onChange={handleChange} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label htmlFor="lead-source" className="form-label-sm">Origem</label><select id="lead-source" name="source" className="form-input" value={form.source} onChange={handleChange}><option value="">Selecione</option>{ALL_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}</select></div>
          <div><label htmlFor="lead-temp" className="form-label-sm">Temperatura</label><select id="lead-temp" name="temperature" className="form-input" value={form.temperature} onChange={handleChange}>{ALL_TEMPS.map(t => <option key={t} value={t}>{TEMP_LABELS[t]}</option>)}</select></div>
        </div>
        <div><label htmlFor="lead-value" className="form-label-sm">Valor esperado (R$)</label><input id="lead-value" name="expected_value" type="number" step="0.01" min="0" className="form-input" value={form.expected_value} onChange={handleChange} /></div>
        <div><label htmlFor="lead-notes" className="form-label-sm">Notas</label><textarea id="lead-notes" name="notes" className="form-input" rows={3} value={form.notes} onChange={handleChange} /></div>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>{saving ? 'Salvando...' : 'Criar Lead'}</button>
      </form>
    </ModalOverlay>
  );
}

// ── Import Modal ──
interface ImportModalProps { token: string | null; onClose: () => void; onImported: () => void; }

interface ImportPreview {
  mapped_leads: Array<{ name: string; email?: string; phone?: string; company?: string; source?: string; status?: string; temperature?: string; expected_value?: number; tags?: string[]; notes?: string }>;
  column_mapping: { [k: string]: string };
  unmapped_columns: string[];
  warnings: string[];
  total_parsed: number;
  total_valid: number;
  total_skipped: number;
  skipped_reasons: string[];
}

function ImportModal({ token, onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rawData, setRawData] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [sourceHint, setSourceHint] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') setFormat('json');
    else setFormat('csv');

    const reader = new FileReader();
    reader.onload = () => { setRawData(reader.result as string); };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!rawData.trim()) { setError('Cole ou faça upload dos dados.'); return; }
    setProcessing(true); setError('');
    try {
      const res = await fetch('/api/leads/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: rawData, format, source_hint: sourceHint || undefined, use_ai: useAI }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error || 'Erro ao processar.'); return; }
      setPreview(await res.json());
      setStep('preview');
    } catch { setError('Erro de conexão.'); } finally { setProcessing(false); }
  };

  const handleConfirm = async () => {
    if (!preview?.mapped_leads.length) return;
    setProcessing(true); setError('');
    try {
      const res = await fetch('/api/leads/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leads: preview.mapped_leads }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error || 'Erro ao importar.'); return; }
      setImportResult(await res.json());
      setStep('done');
    } catch { setError('Erro de conexão.'); } finally { setProcessing(false); }
  };

  return (
    <ModalOverlay onClose={onClose} wide>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--luz-white)', margin: 0 }}>
          <Upload size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden />
          Importar Leads
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} aria-hidden /></button>
      </div>

      {error && <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Source hint */}
          <div>
            <label htmlFor="import-source" className="form-label-sm">Origem dos dados (ajuda a IA mapear melhor)</label>
            <select id="import-source" className="form-input" value={sourceHint} onChange={e => setSourceHint(e.target.value)}>
              <option value="">Selecione a origem</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads (Facebook/Instagram)">Meta Ads (Facebook/Instagram)</option>
              <option value="LinkedIn Ads">LinkedIn Ads</option>
              <option value="Planilha Excel">Planilha Excel</option>
              <option value="CRM antigo">CRM antigo</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Format selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`btn btn-sm ${format === 'csv' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFormat('csv')}>
              <FileText size={14} aria-hidden /> CSV
            </button>
            <button type="button" className={`btn btn-sm ${format === 'json' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFormat('json')}>
              {'{ }'} JSON
            </button>
          </div>

          {/* File upload */}
          <div>
            <input ref={fileInputRef} type="file" accept=".csv,.json,.txt" onChange={handleFile} style={{ display: 'none' }} />
            <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', border: '2px dashed rgba(201,164,74,0.3)', padding: '20px', textAlign: 'center' }}>
              <Upload size={20} style={{ marginRight: 8 }} aria-hidden />
              Clique para selecionar arquivo ou cole os dados abaixo
            </button>
          </div>

          {/* Paste area */}
          <div>
            <label htmlFor="import-data" className="form-label-sm">
              {format === 'csv' ? 'Cole os dados CSV (com cabeçalho na 1ª linha)' : 'Cole o JSON (array de objetos)'}
            </label>
            <textarea
              id="import-data"
              className="form-input"
              rows={10}
              value={rawData}
              onChange={e => setRawData(e.target.value)}
              placeholder={format === 'csv'
                ? 'nome,email,telefone,empresa,origem\nJoão Silva,joao@email.com,11999887766,Academia XYZ,Google Ads'
                : '[{"name": "João Silva", "email": "joao@email.com", "phone": "11999887766"}]'}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>

          {/* AI toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--luz-white)', cursor: 'pointer' }}>
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} />
            Usar IA (Gemini) para mapear colunas automaticamente
            <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>(recomendado para formatos desconhecidos)</span>
          </label>

          <button type="button" className="btn btn-primary" onClick={handlePreview} disabled={processing || !rawData.trim()}>
            {processing ? 'Processando com IA...' : 'Analisar Dados'}
          </button>
        </div>
      )}

      {step === 'preview' && preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="card" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--luz-gold)' }}>{preview.total_parsed}</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Linhas lidas</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{preview.total_valid}</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Válidos</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{preview.total_skipped}</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Ignorados</div>
            </div>
          </div>

          {/* Column mapping */}
          {Object.keys(preview.column_mapping).length > 0 && (
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--luz-gray-dark)', marginBottom: 8 }}>MAPEAMENTO DE COLUNAS (IA)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(preview.column_mapping).map(([src, dst]) => (
                  <span key={src} style={{ fontSize: 11, background: 'rgba(201,164,74,0.1)', padding: '3px 8px', borderRadius: 4, color: 'var(--luz-white)' }}>
                    {src} → <span style={{ color: 'var(--luz-gold)' }}>{dst}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="alert alert-warning" role="alert">
              {preview.warnings.map((w, i) => <div key={i} style={{ fontSize: 12 }}>{w}</div>)}
            </div>
          )}

          {/* Preview table */}
          <div style={{ overflowX: 'auto', maxHeight: 300 }}>
            <table className="crm-import-table">
              <thead>
                <tr>
                  <th>Nome</th><th>Email</th><th>Telefone</th><th>Empresa</th><th>Origem</th><th>Status</th><th>Temp.</th><th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {preview.mapped_leads.slice(0, 50).map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.email || '—'}</td>
                    <td>{l.phone || '—'}</td>
                    <td>{l.company || '—'}</td>
                    <td>{l.source ? SOURCE_LABELS[l.source as LeadSource] || l.source : '—'}</td>
                    <td><span className={`badge badge-${l.status || 'novo'}`} style={{ fontSize: 9, padding: '2px 6px' }}>{STATUS_LABELS[(l.status || 'novo') as LeadStatus]}</span></td>
                    <td><span className={`badge badge-${l.temperature || 'morno'}`} style={{ fontSize: 9, padding: '2px 6px' }}>{TEMP_LABELS[(l.temperature || 'morno') as LeadTemperature]}</span></td>
                    <td>{l.expected_value ? BRL.format(l.expected_value) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.mapped_leads.length > 50 && <p style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textAlign: 'center', marginTop: 8 }}>Mostrando 50 de {preview.mapped_leads.length}</p>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStep('upload')}>Voltar</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={processing || preview.total_valid === 0}>
              {processing ? 'Importando...' : `Importar ${preview.total_valid} leads`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && importResult && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
          <h3 className="exam-section-title" style={{ color: '#4ade80' }}>Importação concluída!</h3>
          <p style={{ color: 'var(--luz-white)', fontSize: 14, marginTop: 8 }}>
            <strong>{importResult.imported}</strong> leads importados com sucesso.
            {importResult.skipped > 0 && <><br /><span style={{ color: 'var(--luz-gray-dark)' }}>{importResult.skipped} ignorados por dados incompletos.</span></>}
          </p>
          <button type="button" className="btn btn-primary" onClick={onImported} style={{ marginTop: 20 }}>Fechar e ver leads</button>
        </div>
      )}
    </ModalOverlay>
  );
}

// ── Shared Modal Overlay ──
function ModalOverlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card animate-fade-in-up" style={{ maxWidth: wide ? 720 : 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
