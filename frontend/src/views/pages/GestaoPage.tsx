import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, Search, Upload, Download, X, Plus, Edit3, Check, ChevronDown,
  Users, DollarSign, FileText, Calendar, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { PatientManagement, GestaoSummary, PackageType, MgmtStatus } from '@shared/types';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const PKG_LABELS: Record<PackageType, string> = {
  mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
};

const STATUS_COLORS: Record<MgmtStatus, string> = {
  ativo: '#4ade80', inativo: '#94a3b8',
};

const BR_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO',
];

type SortKey = keyof PatientManagement;
type SortDir = 'asc' | 'desc';

export default function GestaoPage() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [patients, setPatients] = useState<PatientManagement[]>([]);
  const [summary, setSummary] = useState<GestaoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MgmtStatus | ''>('');
  const [filterPkg, setFilterPkg] = useState<PackageType | ''>('');
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PatientManagement>>({});
  const [saving, setSaving] = useState(false);
  const [fullEditPatient, setFullEditPatient] = useState<PatientManagement | null>(null);
  const [fullEditData, setFullEditData] = useState<Partial<PatientManagement>>({});
  const [savingFull, setSavingFull] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchData = useCallback(async (q?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPkg) params.set('package_type', filterPkg);
      const qs = params.toString() ? `?${params}` : '';
      const hdrs = { Authorization: `Bearer ${token}` };
      const sig = controller.signal;

      const [resList, resSummary] = await Promise.all([
        fetch(`/api/gestao${qs}`, { headers: hdrs, signal: sig }),
        fetch('/api/gestao/summary', { headers: hdrs, signal: sig }),
      ]);

      if (resList.status === 401) { logout(); navigate('/login'); return; }
      if (!resList.ok) { setError('Erro ao carregar dados.'); return; }

      setPatients(await resList.json());
      if (resSummary.ok) setSummary(await resSummary.json());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate, filterStatus, filterPkg]);

  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(search);
  };

  const startEdit = (p: PatientManagement) => {
    setEditingId(p.id);
    setEditData({ ...p });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/gestao/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatients(prev => prev.map(p => p.id === editingId ? updated : p));
        cancelEdit();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const openFullEdit = (p: PatientManagement) => {
    setFullEditPatient(p);
    setFullEditData({ ...p });
  };

  const closeFullEdit = () => {
    setFullEditPatient(null);
    setFullEditData({});
  };

  const saveFullEdit = async () => {
    if (!fullEditPatient) return;
    setSavingFull(true);
    try {
      const res = await fetch(`/api/gestao/${fullEditPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(fullEditData),
      });
      if (!res.ok) return;

      const updated = await res.json();
      setPatients(prev => prev.map(p => p.id === fullEditPatient.id ? updated : p));
      if (editingId === fullEditPatient.id) {
        setEditData(updated);
      }
      closeFullEdit();
    } catch {
      // ignore
    } finally {
      setSavingFull(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedPatients = [...patients].sort((a, b) => {
    const va = (a as any)[sortKey] ?? '';
    const vb = (b as any)[sortKey] ?? '';
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base' });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
  };

  return (
    <div>
      <div className="page-header">
        <ClipboardList size={20} color="var(--luz-gold)" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Seguimento
          </div>
          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>
            Tabela da secretária — pacientes e contrato
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)} title="Importar CSV">
            <Upload size={16} aria-hidden /> Importar
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportCSV(patients)} title="Exportar CSV">
            <Download size={16} aria-hidden /> Exportar
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        {summary ? <SummaryCards summary={summary} /> : null}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 200 }}>
            <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email, telefone, cidade..." style={{ flex: 1 }} aria-label="Buscar" />
            <button type="submit" className="btn btn-ghost btn-sm"><Search size={14} aria-hidden /></button>
          </form>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as MgmtStatus | '')} style={{ width: 'auto', minWidth: 100 }} aria-label="Filtrar status">
            <option value="">Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <select className="form-input" value={filterPkg} onChange={e => setFilterPkg(e.target.value as PackageType | '')} style={{ width: 'auto', minWidth: 120 }} aria-label="Filtrar pacote">
            <option value="">Pacote</option>
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="agenda-loading"><div className="agenda-loading-spinner" aria-hidden /><p>Carregando...</p></div>
        ) : error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <AlertCircle size={48} color="var(--luz-gold)" aria-hidden />
            <p style={{ color: 'var(--luz-gray-dark)' }}>{error}</p>
            <button type="button" className="btn btn-ghost" onClick={() => fetchData()}>Tentar novamente</button>
          </div>
        ) : (
          <div className="gestao-table-wrap">
            <table className="gestao-table">
              <thead>
                <tr>
                  <ThSort label="Nome" sortKey="name" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Status" sortKey="mgmt_status" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Telefone" sortKey="phone" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="E-mail" sortKey="email" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Cidade/UF" sortKey="city" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Convênio" sortKey="insurance_name" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Pacote" sortKey="package_type" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Valor/mês" sortKey="monthly_value" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Pagamento" sortKey="payment_date" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Próx. Consulta" sortKey="next_consultation" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Contrato" sortKey="contract_done" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Origem" sortKey="origin" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="EA" sortKey="uses_ea" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Filhos" sortKey="wants_children" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <ThSort label="Obs" sortKey="observations" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <th className="gestao-th" style={{ width: 120 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedPatients.length === 0 ? (
                  <tr><td colSpan={16} style={{ textAlign: 'center', padding: 40, color: 'var(--luz-gray-dark)' }}>Nenhum paciente encontrado.</td></tr>
                ) : null}
                {sortedPatients.map(p => {
                  const isEditing = editingId === p.id;

                  return isEditing ? (
                    <tr key={p.id} className="gestao-row gestao-row-editing">
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></td>
                      <td className="gestao-td">
                        <select className="gestao-cell-input" value={editData.mgmt_status || 'ativo'} onChange={e => setEditData(d => ({ ...d, mgmt_status: e.target.value as MgmtStatus }))}>
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                        </select>
                      </td>
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.phone || ''} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} /></td>
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.email || ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} /></td>
                      <td className="gestao-td">
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input className="gestao-cell-input" value={editData.city || ''} onChange={e => setEditData(d => ({ ...d, city: e.target.value }))} style={{ flex: 1 }} placeholder="Cidade" />
                          <select className="gestao-cell-input" value={editData.state || ''} onChange={e => setEditData(d => ({ ...d, state: e.target.value }))} style={{ width: 55 }}>
                            <option value="">UF</option>
                            {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.insurance_name || ''} onChange={e => setEditData(d => ({ ...d, insurance_name: e.target.value }))} /></td>
                      <td className="gestao-td">
                        <select className="gestao-cell-input" value={editData.package_type || ''} onChange={e => setEditData(d => ({ ...d, package_type: (e.target.value || undefined) as PackageType | undefined }))}>
                          <option value="">—</option>
                          <option value="mensal">Mensal</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="semestral">Semestral</option>
                          <option value="anual">Anual</option>
                        </select>
                      </td>
                      <td className="gestao-td"><input className="gestao-cell-input" type="number" step="0.01" value={editData.monthly_value ?? ''} onChange={e => setEditData(d => ({ ...d, monthly_value: e.target.value ? Number(e.target.value) : undefined }))} /></td>
                      <td className="gestao-td"><input className="gestao-cell-input" type="date" value={editData.payment_date || ''} onChange={e => setEditData(d => ({ ...d, payment_date: e.target.value }))} /></td>
                      <td className="gestao-td"><input className="gestao-cell-input" type="date" value={editData.next_consultation || ''} onChange={e => setEditData(d => ({ ...d, next_consultation: e.target.value }))} /></td>
                      <td className="gestao-td">
                        <select className="gestao-cell-input" value={editData.contract_done ? '1' : '0'} onChange={e => setEditData(d => ({ ...d, contract_done: e.target.value === '1' }))}>
                          <option value="0">Não</option>
                          <option value="1">Sim</option>
                        </select>
                      </td>
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.origin || ''} onChange={e => setEditData(d => ({ ...d, origin: e.target.value }))} /></td>
                      <td className="gestao-td">
                        <select className="gestao-cell-input" value={editData.uses_ea ? '1' : '0'} onChange={e => setEditData(d => ({ ...d, uses_ea: e.target.value === '1' }))}>
                          <option value="0">Não</option>
                          <option value="1">Sim</option>
                        </select>
                      </td>
                      <td className="gestao-td">
                        <select className="gestao-cell-input" value={editData.wants_children ? '1' : '0'} onChange={e => setEditData(d => ({ ...d, wants_children: e.target.value === '1' }))}>
                          <option value="0">Não</option>
                          <option value="1">Sim</option>
                        </select>
                      </td>
                      <td className="gestao-td"><input className="gestao-cell-input" value={editData.observations || ''} onChange={e => setEditData(d => ({ ...d, observations: e.target.value }))} /></td>
                      <td className="gestao-td" style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving} style={{ padding: '2px 6px', marginRight: 4 }} title="Salvar">
                          <Check size={12} aria-hidden />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit} style={{ padding: '2px 6px' }} title="Cancelar">
                          <X size={12} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id} className="gestao-row" onDoubleClick={() => startEdit(p)}>
                      <td className="gestao-td gestao-td-name">{p.name}</td>
                      <td className="gestao-td">
                        <span style={{ color: STATUS_COLORS[(p.mgmt_status || 'ativo') as MgmtStatus], fontWeight: 600, fontSize: 11 }}>
                          {(p.mgmt_status || 'ativo').charAt(0).toUpperCase() + (p.mgmt_status || 'ativo').slice(1)}
                        </span>
                      </td>
                      <td className="gestao-td">{p.phone || '—'}</td>
                      <td className="gestao-td">{p.email || '—'}</td>
                      <td className="gestao-td">{[p.city, p.state].filter(Boolean).join('/') || '—'}</td>
                      <td className="gestao-td">{p.insurance_name || '—'}</td>
                      <td className="gestao-td">{p.package_type ? PKG_LABELS[p.package_type] : '—'}</td>
                      <td className="gestao-td" style={{ color: 'var(--luz-gold)', fontWeight: 600 }}>{p.monthly_value ? BRL.format(p.monthly_value) : '—'}</td>
                      <td className="gestao-td">{formatDate(p.payment_date)}</td>
                      <td className="gestao-td">{formatDate(p.next_consultation)}</td>
                      <td className="gestao-td">{p.contract_done ? <Check size={14} color="#4ade80" aria-hidden /> : '—'}</td>
                      <td className="gestao-td">{p.origin || '—'}</td>
                      <td className="gestao-td">{p.uses_ea ? 'Sim' : 'Não'}</td>
                      <td className="gestao-td">{p.wants_children ? 'Sim' : 'Não'}</td>
                      <td className="gestao-td gestao-td-obs" title={p.observations || ''}>{p.observations ? truncate(p.observations, 30) : '—'}</td>
                      <td className="gestao-td">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(p)} style={{ padding: '2px 6px', marginRight: 4 }} title="Editar rápido">
                          <Edit3 size={12} aria-hidden />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openFullEdit(p)} style={{ padding: '2px 8px' }} title="Editar todos os campos">
                          Completo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 8, textAlign: 'right' }}>
          {patients.length} pacientes &middot; Duplo-clique para editar
        </div>
      </div>

      {fullEditPatient ? (
        <FullEditModal
          patient={fullEditPatient}
          data={fullEditData}
          setData={setFullEditData}
          onSave={saveFullEdit}
          onClose={closeFullEdit}
          saving={savingFull}
        />
      ) : null}

      {showImport ? <ImportCSVModal token={token} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); fetchData(); }} /> : null}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function exportCSV(patients: PatientManagement[]) {
  const headers = ['Nome', 'Status', 'CPF', 'Nascimento', 'Sexo', 'E-mail', 'Tel 1', 'Tel 2', 'Endereço', 'CEP', 'Cidade', 'Estado', 'Convênio', 'Plano', 'Primeira Consulta', 'Última Consulta', 'Próxima Consulta', 'Última Receita', 'Último Exame', 'Usa EA', 'Quer Filhos', 'Obs', 'Origem', 'Pacote', 'Valor/mês', 'Data Pagamento', 'NF', 'Contrato', 'Início Contrato', 'Venc Contrato'];
  const rows = patients.map(p => [
    p.name, p.mgmt_status || 'ativo', p.cpf_encrypted || '', p.birth_date || '', p.gender || '',
    p.email || '', p.phone || '', p.phone2 || '', p.address || '', p.cep || '', p.city || '', p.state || '',
    p.insurance_name || '', p.insurance_plan || '', p.first_consultation || '', p.last_consultation || '',
    p.next_consultation || '', p.last_prescription || '', p.last_exam || '',
    p.uses_ea ? 'Sim' : 'Não', p.wants_children ? 'Sim' : 'Não', p.observations || '', p.origin || '',
    p.package_type || '', p.monthly_value || '', p.payment_date || '', p.needs_nf ? 'Sim' : 'Não',
    p.contract_done ? 'Sim' : 'Não', p.contract_start || '', p.contract_end || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gestao-pacientes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Sort header ──
function ThSort({ label, sortKey, current, dir, onClick }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onClick: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th className="gestao-th" onClick={() => onClick(sortKey)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        {isActive ? (
          <ChevronDown size={10} style={{ transform: dir === 'asc' ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} aria-hidden />
        ) : null}
      </span>
    </th>
  );
}

// ── KPI Summary Cards ──
function SummaryCards({ summary }: { summary: GestaoSummary }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <Users size={16} color="var(--luz-gold)" style={{ marginBottom: 4 }} aria-hidden />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--luz-gold)' }}>{summary.ativos}</div>
          <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>Pacientes ativos</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <DollarSign size={16} color="#4ade80" style={{ marginBottom: 4 }} aria-hidden />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{BRL.format(summary.mrrTotal)}</div>
          <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>MRR</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <FileText size={16} color="var(--luz-gold)" style={{ marginBottom: 4 }} aria-hidden />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--luz-gold)' }}>{summary.withContract}</div>
          <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>Com contrato</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <Calendar size={16} color="#fb923c" style={{ marginBottom: 4 }} aria-hidden />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fb923c' }}>{summary.upcomingConsultations}</div>
          <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>Consultas 7d</div>
        </div>
        {summary.pendingNF > 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
            <AlertCircle size={16} color="#f87171" style={{ marginBottom: 4 }} aria-hidden />
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{summary.pendingNF}</div>
            <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>Pendente NF</div>
          </div>
        ) : null}
      </div>

      {/* Package distribution */}
      {summary.byPackage.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {summary.byPackage.map(p => (
            <span key={p.type} style={{ fontSize: 11, background: 'rgba(201,164,74,0.1)', padding: '3px 8px', borderRadius: 6, color: 'var(--luz-white)' }}>
              {PKG_LABELS[p.type as PackageType] || p.type}: <strong style={{ color: 'var(--luz-gold)' }}>{p.count}</strong>
            </span>
          ))}
          {summary.byState.slice(0, 5).map(s => (
            <span key={s.state} style={{ fontSize: 11, background: 'rgba(148,163,184,0.1)', padding: '3px 8px', borderRadius: 6, color: 'var(--luz-white)' }}>
              {s.state}: <strong>{s.count}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FullEditModal({
  patient,
  data,
  setData,
  onSave,
  onClose,
  saving,
}: {
  patient: PatientManagement;
  data: Partial<PatientManagement>;
  setData: React.Dispatch<React.SetStateAction<Partial<PatientManagement>>>;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const setField = <K extends keyof PatientManagement>(key: K, value: PatientManagement[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in-up"
        style={{ maxWidth: 980, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--luz-white)', margin: 0 }}>
            Editar paciente completo - {patient.name}
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} aria-hidden /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <input className="form-input" placeholder="Nome completo" value={data.name || ''} onChange={e => setField('name', e.target.value)} />
          <input className="form-input" placeholder="CPF" value={data.cpf_encrypted || ''} onChange={e => setField('cpf_encrypted', e.target.value)} />

          <input className="form-input" type="date" value={data.birth_date || ''} onChange={e => setField('birth_date', e.target.value)} />
          <select className="form-input" value={data.gender || ''} onChange={e => setField('gender', (e.target.value || undefined) as PatientManagement['gender'])}>
            <option value="">Sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="outro">Outro</option>
          </select>

          <input className="form-input" placeholder="E-mail" value={data.email || ''} onChange={e => setField('email', e.target.value)} />
          <input className="form-input" placeholder="Telefone 1" value={data.phone || ''} onChange={e => setField('phone', e.target.value)} />

          <input className="form-input" placeholder="Telefone 2" value={data.phone2 || ''} onChange={e => setField('phone2', e.target.value)} />
          <input className="form-input" placeholder="CEP" value={data.cep || ''} onChange={e => setField('cep', e.target.value)} />

          <input className="form-input" placeholder="Cidade" value={data.city || ''} onChange={e => setField('city', e.target.value)} />
          <select className="form-input" value={data.state || ''} onChange={e => setField('state', e.target.value)}>
            <option value="">UF</option>
            {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input className="form-input" placeholder="Endereço" value={data.address || ''} onChange={e => setField('address', e.target.value)} />
          <input className="form-input" placeholder="Convênio" value={data.insurance_name || ''} onChange={e => setField('insurance_name', e.target.value)} />

          <input className="form-input" placeholder="Plano de saúde" value={data.insurance_plan || ''} onChange={e => setField('insurance_plan', e.target.value)} />
          <input className="form-input" placeholder="Origem" value={data.origin || ''} onChange={e => setField('origin', e.target.value)} />

          <select className="form-input" value={data.mgmt_status || 'ativo'} onChange={e => setField('mgmt_status', e.target.value as MgmtStatus)}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <select className="form-input" value={data.package_type || ''} onChange={e => setField('package_type', (e.target.value || undefined) as PackageType | undefined)}>
            <option value="">Pacote</option>
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>

          <input className="form-input" type="number" step="0.01" placeholder="Valor mensal" value={data.monthly_value ?? ''} onChange={e => setField('monthly_value', e.target.value ? Number(e.target.value) : undefined)} />
          <input className="form-input" type="date" value={data.payment_date || ''} onChange={e => setField('payment_date', e.target.value)} />

          <input className="form-input" type="date" value={data.first_consultation || ''} onChange={e => setField('first_consultation', e.target.value)} />
          <input className="form-input" type="date" value={data.last_consultation || ''} onChange={e => setField('last_consultation', e.target.value)} />

          <input className="form-input" type="date" value={data.next_consultation || ''} onChange={e => setField('next_consultation', e.target.value)} />
          <input className="form-input" type="date" value={data.last_prescription || ''} onChange={e => setField('last_prescription', e.target.value)} />

          <input className="form-input" type="date" value={data.last_exam || ''} onChange={e => setField('last_exam', e.target.value)} />
          <div />

          <select className="form-input" value={data.uses_ea ? '1' : '0'} onChange={e => setField('uses_ea', e.target.value === '1')}>
            <option value="0">Nao usa EA</option>
            <option value="1">Usa EA</option>
          </select>
          <select className="form-input" value={data.wants_children ? '1' : '0'} onChange={e => setField('wants_children', e.target.value === '1')}>
            <option value="0">Nao quer filhos</option>
            <option value="1">Quer filhos</option>
          </select>

          <select className="form-input" value={data.needs_nf ? '1' : '0'} onChange={e => setField('needs_nf', e.target.value === '1')}>
            <option value="0">Nao precisa NF</option>
            <option value="1">Precisa NF</option>
          </select>
          <select className="form-input" value={data.contract_done ? '1' : '0'} onChange={e => setField('contract_done', e.target.value === '1')}>
            <option value="0">Contrato pendente</option>
            <option value="1">Contrato feito</option>
          </select>

          <input className="form-input" type="date" value={data.contract_start || ''} onChange={e => setField('contract_start', e.target.value)} />
          <input className="form-input" type="date" value={data.contract_end || ''} onChange={e => setField('contract_end', e.target.value)} />
        </div>

        <div style={{ marginTop: 10 }}>
          <label htmlFor="full-edit-observations" className="form-label-sm">Observacoes</label>
          <textarea
            id="full-edit-observations"
            className="form-input"
            rows={3}
            value={data.observations || ''}
            onChange={e => setField('observations', e.target.value)}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label htmlFor="full-edit-notes" className="form-label-sm">Notas clinicas</label>
          <textarea
            id="full-edit-notes"
            className="form-input"
            rows={3}
            value={data.notes || ''}
            onChange={e => setField('notes', e.target.value)}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label htmlFor="full-edit-contract-notes" className="form-label-sm">Notas de contrato</label>
          <textarea
            id="full-edit-contract-notes"
            className="form-input"
            rows={2}
            value={data.contract_notes || ''}
            onChange={e => setField('contract_notes', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar tudo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSV Import Modal ──
function ImportCSVModal({ token, onClose, onImported }: { token: string | null; onClose: () => void; onImported: () => void }) {
  const [rawData, setRawData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawData(reader.result as string);
    reader.readAsText(file);
  };

  const parseCSV = (raw: string): object[] => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());

      const obj: { [k: string]: string } = {};
      headers.forEach((h, i) => { if (h) obj[h] = values[i] || ''; });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!rawData.trim()) { setError('Cole ou faça upload do CSV.'); return; }
    setProcessing(true); setError('');
    try {
      const rows = parseCSV(rawData);
      if (rows.length === 0) { setError('Nenhum dado válido encontrado.'); setProcessing(false); return; }

      const res = await fetch('/api/gestao/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error || 'Erro.'); return; }
      setResult(await res.json());
    } catch { setError('Erro de conexão.'); } finally { setProcessing(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card animate-fade-in-up" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--luz-white)', margin: 0 }}>
            <Upload size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden />
            Importar Planilha
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} aria-hidden /></button>
        </div>

        {error ? <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}

        {result ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
            <h3 className="exam-section-title" style={{ color: '#4ade80' }}>Importação concluída!</h3>
            <p style={{ color: 'var(--luz-white)', fontSize: 14, marginTop: 8 }}>
              <strong>{result.imported}</strong> novos pacientes importados.
              {result.updated > 0 ? <><br />{result.updated} já existiam (ignorados).</> : null}
              {result.skipped > 0 ? <><br />{result.skipped} linhas ignoradas (sem nome ou erro).</> : null}
            </p>
            {result.errors && result.errors.length > 0 ? (
              <div style={{ marginTop: 16, textAlign: 'left', background: 'rgba(248,113,113,0.1)', borderRadius: 8, padding: 12, maxHeight: 150, overflowY: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f87171', marginBottom: 6 }}>Detalhes dos erros:</div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--luz-gray-dark)', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{e}</div>
                ))}
              </div>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={onImported} style={{ marginTop: 20 }}>Fechar</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--luz-gray-dark)' }}>
              Faça upload do CSV no mesmo formato da planilha "Pacientes Ativos". Colunas reconhecidas automaticamente.
            </p>
            <div>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
              <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} style={{ width: '100%', border: '2px dashed rgba(201,164,74,0.3)', padding: 20, textAlign: 'center' }}>
                <Upload size={20} style={{ marginRight: 8 }} aria-hidden />
                Selecionar arquivo CSV
              </button>
            </div>
            <div>
              <label htmlFor="import-csv-data" className="form-label-sm">Ou cole o conteúdo CSV:</label>
              <textarea id="import-csv-data" className="form-input" rows={8} value={rawData} onChange={e => setRawData(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 11 }} />
            </div>
            <button type="button" className="btn btn-primary" onClick={handleImport} disabled={processing || !rawData.trim()}>
              {processing ? 'Importando...' : 'Importar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
