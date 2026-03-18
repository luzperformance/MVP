import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, ArrowDownCircle, ArrowUpCircle, Plus, Upload, FileSpreadsheet } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { FinanceSummaryResponse } from '../../shared/types';

const REVENUE_COLOR = '#22c55e';
const EXPENSE_COLOR = '#ef4444';
const RESULT_POSITIVE = '#22c55e';
const RESULT_NEGATIVE = '#ef4444';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceDashboardPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<FinanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'revenue' as 'revenue' | 'expense', category: '', amount: '', entry_date: new Date().toISOString().slice(0, 10), description: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; totalRows: number; errors?: { row: number; message: string }[]; message: string } | null>(null);

  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const json = await res.json();
      if (!res.ok || !json.kpis) {
        if (mountedRef.current) setData(null);
        return;
      }
      if (mountedRef.current) setData(json as FinanceSummaryResponse);
    } catch {
      if (mountedRef.current) setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    // Requisição cancelada quando sair da tela (evita updates em componente desmontado)
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
      const json = await res.json();
      if (!res.ok) {
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
          totalRows: json.totalRows ?? 0,
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
    return data.monthly.map(m => ({
      ...m,
      monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    }));
  }, [data]);

  const hasKpis = data && typeof data.kpis === 'object';

  return (
    <div className="finance-dashboard">
      <div className="page-header">
        <DollarSign size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Dashboard Financeiro
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            Receitas, despesas e resultado
          </div>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="finance-loading">
            <div className="finance-loading-spinner" aria-hidden />
            <p>Carregando dados financeiros...</p>
          </div>
        ) : !hasKpis ? (
          <div className="card animate-fade-in-up finance-empty-state">
            <DollarSign size={48} color="var(--luz-gold)" className="finance-empty-icon" aria-hidden />
            <h3 className="exam-section-title">Não foi possível carregar os dados</h3>
            <p>Verifique se o servidor está rodando e se você está logado. A rota é <code>/api/finance/summary</code>.</p>
          </div>
        ) : (
          <div className="stagger stagger-sections finance-dashboard-content">
            {/* Period + Add entry */}
            <div className="card animate-fade-in-up" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div className="exam-section-label" style={{ marginBottom: 12 }}>Período</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`btn btn-sm ${period === m ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPeriod(m)}
                    >
                      {m} meses
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                <Plus size={16} aria-hidden />
                {showForm ? 'Fechar' : 'Novo lançamento'}
              </button>
            </div>

            {/* Atualizar por planilha CSV */}
            <div className="card animate-fade-in-up finance-import-card" style={{ marginBottom: 20 }}>
              <h3 className="exam-section-title" style={{ marginBottom: 12 }}>
                <FileSpreadsheet size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden />
                Atualizar por planilha
              </h3>
              <p className="finance-import-hint" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 16 }}>
                Envie um CSV com colunas: <code>tipo</code> (receita/despesa), <code>categoria</code>, <code>valor</code>, <code>data</code> (AAAA-MM-DD ou DD/MM/AAAA). Opcional: <code>descricao</code>.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <input
                  id="finance-csv-input"
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportResult(null);
                  }}
                  className="finance-import-input"
                  aria-label="Selecionar arquivo CSV"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleImportCsv}
                  disabled={!importFile || importing}
                  aria-label="Importar CSV"
                >
                  <Upload size={16} aria-hidden />
                  {importing ? 'Importando...' : 'Importar CSV'}
                </button>
                {importFile && (
                  <span style={{ fontSize: 12, color: 'var(--luz-gray)' }}>
                    {importFile.name}
                  </span>
                )}
              </div>
              {importResult && (
                <div className="finance-import-result" style={{ marginTop: 16 }}>
                  <p style={{ color: importResult.imported > 0 ? 'var(--luz-success)' : 'var(--luz-gray)', fontSize: 13, marginBottom: importResult.errors?.length ? 8 : 0 }}>
                    {importResult.message}
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'var(--luz-warning)' }}>
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>Linha {err.row}: {err.message}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>… e mais {importResult.errors.length - 10} erro(s)</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {showForm && (
              <div className="card animate-fade-in-up" style={{ marginBottom: 20 }}>
                <h3 className="exam-section-title" style={{ marginBottom: 16 }}>Novo lançamento</h3>
                <form onSubmit={handleSubmitEntry}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Tipo</label>
                      <select
                        className="form-input"
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value as 'revenue' | 'expense' }))}
                        style={{ minHeight: 44 }}
                      >
                        <option value="revenue">Receita</option>
                        <option value="expense">Despesa</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Categoria</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Consultas, Aluguel"
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input"
                        placeholder="0,00"
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Data</label>
                      <input
                        type="date"
                        className="form-input"
                        value={form.entry_date}
                        onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Descrição (opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Consulta Dr. Silva"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  {submitError && <p style={{ color: 'var(--luz-danger)', fontSize: 13, marginBottom: 12 }}>{submitError}</p>}
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Salvar lançamento'}
                  </button>
                </form>
              </div>
            )}

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="card animate-fade-in-up kpi-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ArrowUpCircle size={20} color={REVENUE_COLOR} aria-hidden />
                  <span className="exam-section-label" style={{ marginBottom: 0 }}>Receita (mês)</span>
                </div>
                <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: REVENUE_COLOR }}>
                  {formatCurrency(data.kpis.revenueMonth)}
                </div>
              </div>
              <div className="card animate-fade-in-up kpi-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ArrowDownCircle size={20} color={EXPENSE_COLOR} aria-hidden />
                  <span className="exam-section-label" style={{ marginBottom: 0 }}>Despesas (mês)</span>
                </div>
                <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: EXPENSE_COLOR }}>
                  {formatCurrency(data.kpis.expenseMonth)}
                </div>
              </div>
              <div className="card animate-fade-in-up kpi-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <TrendingUp size={20} color={data.kpis.resultMonth >= 0 ? RESULT_POSITIVE : RESULT_NEGATIVE} aria-hidden />
                  <span className="exam-section-label" style={{ marginBottom: 0 }}>Resultado (mês)</span>
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: data.kpis.resultMonth >= 0 ? RESULT_POSITIVE : RESULT_NEGATIVE,
                  }}
                >
                  {formatCurrency(data.kpis.resultMonth)}
                </div>
              </div>
            </div>

            {/* Totals in period */}
            <div className="card animate-fade-in-up" style={{ marginBottom: 20 }}>
              <h3 className="exam-section-title" style={{ marginBottom: 16 }}>Totais no período</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita total</div>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: REVENUE_COLOR }}>{formatCurrency(data.kpis.revenueTotal)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Despesas total</div>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: EXPENSE_COLOR }}>{formatCurrency(data.kpis.expenseTotal)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resultado</div>
                  <div
                    className="font-display"
                    style={{ fontSize: 16, fontWeight: 700, color: data.kpis.resultTotal >= 0 ? RESULT_POSITIVE : RESULT_NEGATIVE }}
                  >
                    {formatCurrency(data.kpis.resultTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="card animate-fade-in-up finance-chart-card">
                <h3 className="exam-section-title" style={{ marginBottom: 20 }}>Receita x Despesa por mês</h3>
                <div className="finance-chart-wrap">
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="monthLabel" stroke="var(--luz-gray-dark)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="var(--luz-gray-dark)" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--luz-navy)',
                          border: '1px solid rgba(201,164,74,0.3)',
                          borderRadius: 8,
                          color: 'var(--luz-white)',
                        }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelFormatter={label => label}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Receita" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Despesa" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData.length === 0 && hasKpis && (
              <div className="card animate-fade-in-up finance-empty-chart">
                <DollarSign size={40} color="var(--luz-gold)" aria-hidden />
                <p>Nenhum lançamento no período.</p>
                <p className="finance-empty-hint">Clique em &quot;Novo lançamento&quot; para cadastrar receitas e despesas.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
