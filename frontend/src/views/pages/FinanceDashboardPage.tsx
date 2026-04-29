import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, DollarSign, ArrowDownCircle, ArrowUpCircle, Plus, Upload, FileSpreadsheet, Calendar, PieChart as PieIcon, ListFilter } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { FinanceSummaryResponse } from '@shared/types';

// Otimização Vercel: Constantes fora do componente
const REVENUE_COLOR = '#22c55e';
const EXPENSE_COLOR = '#ef4444';
const RESULT_POSITIVE = '#22c55e';
const RESULT_NEGATIVE = '#ef4444';
const PIE_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

const CHART_MARGIN = { top: 10, right: 20, left: 0, bottom: 5 };
const CHART_GRID_STROKE = "rgba(255,255,255,0.05)";
const CHART_TICK_STYLE = { fontSize: 11 };

const SummaryKPICard = React.memo(({ title, value, color, icon: Icon, subValue }: any) => (
  <div className="card animate-fade-in-up kpi-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Icon size={20} color={color} aria-hidden />
      <span className="exam-section-label" style={{ marginBottom: 0 }}>{title}</span>
    </div>
    <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color }}>
      {value}
    </div>
    {subValue && <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)', marginTop: 4 }}>{subValue}</div>}
  </div>
));

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceDashboardPage() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'revenue' as 'revenue' | 'expense', category: '', amount: '', entry_date: new Date().toISOString().slice(0, 10), description: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  
  // Novos estados para filtros
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);

  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      let url = `/api/finance/summary?period=${period}`;
      if (customDates.from && customDates.to) {
        url = `/api/finance/summary?from=${customDates.from}&to=${customDates.to}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const json = await res.json();
      if (!res.ok || !json.kpis) {
        if (mountedRef.current) setData(null);
        return;
      }
      if (mountedRef.current) setData(json);
    } catch {
      if (mountedRef.current) setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token, period, customDates]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    fetchSummary(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchSummary]);

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    const amount = parseFloat(form.amount.replace(/,/g, '.'));
    if (!form.category.trim() || Number.isNaN(amount) || amount <= 0) {
      if (mountedRef.current) {
        setSubmitError('Preencha categoria e valor válido.');
        setSubmitting(false);
      }
      return;
    }
    try {
      const res = await fetch('/api/finance/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: form.type,
          category: form.category.trim(),
          amount,
          entry_date: form.entry_date,
          description: form.description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        if (mountedRef.current) {
          setSubmitError(json.error || 'Erro ao salvar.');
          setSubmitting(false);
        }
        return;
      }
      if (mountedRef.current) {
        setForm({
          ...form,
          category: '',
          amount: '',
          description: '',
          entry_date: new Date().toISOString().slice(0, 10),
        });
        setShowForm(false);
        fetchSummary();
      }
    } catch {
      if (mountedRef.current) setSubmitError('Erro de conexão.');
    }
    if (mountedRef.current) setSubmitting(false);
  };

  const handleImportCsv = async () => {
    if (!importFile || importing) return;
    setImportResult(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetch('/api/finance/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        if (mountedRef.current) {
          setImportResult({ imported: 0, totalRows: 0, message: json.error || 'Erro ao importar.' });
          setImporting(false);
        }
        return;
      }
      if (mountedRef.current) {
        setImportResult({
          imported: json.imported ?? 0,
          totalRows: json.total ?? 0,
          errors: json.errors,
          message: json.message || `${json.imported} lançamento(s) importado(s).`,
        });
        setImportFile(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
      fetchSummary();
    } catch {
      if (mountedRef.current) setImportResult({ imported: 0, totalRows: 0, message: 'Erro de conexão.' });
    }
    if (mountedRef.current) setImporting(false);
  };

  const chartData = React.useMemo(() => {
    if (!data?.monthly?.length) return [];
    return data.monthly.map((m: any) => ({
      ...m,
      monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    }));
  }, [data]);

  const hasKpis = data && typeof data.kpis === 'object';

  return (
    <div className="finance-dashboard animate-fade-in">
      <div className="page-header glass-surface">
        <DollarSign size={20} color="var(--luz-gold)" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display text-gold-gradient" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>
            Gestão Financeira
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)', fontWeight: 500 }}>
            Saúde econômica e projeções de performance
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={16} /> Filtros
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="page-content grid-pattern">
        {loading ? (
          <div className="finance-loading" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="finance-loading-spinner" aria-hidden />
            <p style={{ marginTop: 20, color: 'var(--luz-gray-dark)', fontSize: 14 }}>Sincronizando dados...</p>
          </div>
        ) : !hasKpis ? (
          <div className="card glass-card animate-fade-in-up" style={{ textAlign: 'center', padding: 64 }}>
            <DollarSign size={48} color="rgba(201,164,74,0.2)" style={{ marginBottom: 16 }} />
            <h3 className="font-display">Ops! Nenhum dado financeiro.</h3>
            <p style={{ color: 'var(--luz-gray-dark)', margin: '12px 0 24px' }}>Inicie novos lançamentos ou importe uma planilha para ver o dashboard.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Começar agora</button>
          </div>
        ) : (
          <div className="stagger stagger-sections">
            
            {/* Extended Filters */}
            {showFilters && (
              <div className="card glass-card animate-fade-in-down" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'end' }}>
                  <div>
                    <label className="form-label-sm">Período Predefinido</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[3, 6, 12].map(m => (
                        <button key={m} onClick={() => { setPeriod(m); setCustomDates({from:'', to:''}); }} className={`btn btn-sm ${period === m && !customDates.from ? 'btn-primary' : 'btn-ghost'}`}>{m} meses</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label-sm">Início</label>
                    <input type="date" className="form-input-sm" value={customDates.from} onChange={e => setCustomDates(d => ({ ...d, from: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label-sm">Fim</label>
                    <input type="date" className="form-input-sm" value={customDates.to} onChange={e => setCustomDates(d => ({ ...d, to: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Main KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
              <SummaryKPICard title="Receita (Mês)" value={formatCurrency(data.kpis.revenueMonth)} color={REVENUE_COLOR} icon={ArrowUpCircle} />
              <SummaryKPICard title="Despesas (Mês)" value={formatCurrency(data.kpis.expenseMonth)} color={EXPENSE_COLOR} icon={ArrowDownCircle} />
              <SummaryKPICard title="Resultado (Mês)" value={formatCurrency(data.kpis.resultMonth)} color={data.kpis.resultMonth >= 0 ? RESULT_POSITIVE : RESULT_NEGATIVE} icon={TrendingUp} />
              <SummaryKPICard title="EBITDA Projetado (Ano)" value={formatCurrency(data.kpis.projectedAnnualProfit)} color="var(--luz-gold)" icon={TrendingUp} subValue="Baseado na média mensal do período" />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Evolution Chart */}
              {chartData.length > 0 ? (
                <div className="card glass-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <Calendar size={18} color="var(--luz-gold)" />
                    <h3 className="font-display" style={{ fontSize: 14, margin: 0 }}>Evolução Mensal</h3>
                  </div>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={CHART_MARGIN}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                        <XAxis dataKey="monthLabel" stroke="var(--luz-gray-dark)" tick={CHART_TICK_STYLE} />
                        <YAxis stroke="var(--luz-gray-dark)" tick={CHART_TICK_STYLE} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: 'rgba(13,31,51,0.95)', border: '1px solid var(--luz-gold)', borderRadius: 12 }} />
                        <Bar dataKey="revenue" name="Receita" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesa" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}

              {/* Category Breakdown (Pie Chart) */}
              {data.categories?.length > 0 ? (
                <div className="card glass-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <PieIcon size={18} color="var(--luz-gold)" />
                    <h3 className="font-display" style={{ fontSize: 14, margin: 0 }}>Mix de Despesas</h3>
                  </div>
                  <div style={{ display: 'flex', height: 300, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.categories}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                          >
                            {data.categories.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.categories.slice(0, 5).map((cat: any, i: number) => (
                        <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '2px', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <div style={{ flex: 1, fontSize: 11, color: 'var(--luz-white)', fontWeight: 500 }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>{formatCurrency(cat.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Actions (Add/Import) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {showForm && (
                <div className="card glass-card animate-fade-in-up" style={{ padding: 24 }}>
                  <h3 className="font-display" style={{ fontSize: 13, color: 'var(--luz-gold)', marginBottom: 20 }}>NOVO LANÇAMENTO</h3>
                  <form onSubmit={handleSubmitEntry}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                        <option value="revenue">Receita (+)</option>
                        <option value="expense">Despesa (-)</option>
                      </select>
                      <input type="text" className="form-input" placeholder="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <input type="number" className="form-input" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                      <input type="date" className="form-input" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} required />
                    </div>
                    <input type="text" className="form-input" placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ marginBottom: 20 }} />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>Salvar Registro</button>
                  </form>
                </div>
              )}
              
              <div className="card glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 className="font-display" style={{ fontSize: 13, color: 'var(--luz-gold)', marginBottom: 12 }}>IMPORTAÇÃO RÁPIDA</h3>
                <p style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginBottom: 20 }}>Atualize seu financeiro enviando uma planilha CSV.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input ref={csvInputRef} type="file" hidden accept=".csv" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => csvInputRef.current?.click()}>
                    <FileSpreadsheet size={16} /> {importFile ? importFile.name.slice(0,10)+'...' : 'Escolher Arquivo'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleImportCsv} disabled={!importFile || importing}>
                    {importing ? 'Processando...' : 'Fazer Upload'}
                  </button>
                </div>
                {importResult && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--luz-success)' }}>{importResult.message}</div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
