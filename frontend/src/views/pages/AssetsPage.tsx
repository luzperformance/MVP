import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { Asset, AssetType, AssetStatus } from '@shared/types';

const TYPE_LABELS: Record<AssetType, string> = {
  equipamento: 'Equipamento', protocolo: 'Protocolo', suplemento: 'Suplemento',
  contrato: 'Contrato', documento: 'Documento', outro: 'Outro',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  ativo: 'Ativo', inativo: 'Inativo', vendido: 'Vendido', expirado: 'Expirado',
};

const ALL_TYPES: AssetType[] = ['equipamento', 'protocolo', 'suplemento', 'contrato', 'documento', 'outro'];
const ALL_STATUSES: AssetStatus[] = ['ativo', 'inativo', 'vendido', 'expirado'];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AssetsPage() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AssetType | ''>('');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchAssets = useCallback(async (q?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const qs = params.toString() ? `?${params}` : '';

      const res = await fetch(`/api/assets${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (res.status === 401) { logout(); navigate('/login'); return; }
      if (!res.ok) { setError('Erro ao carregar ativos.'); setAssets([]); return; }

      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão com o servidor.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate, filterType, filterStatus]);

  useEffect(() => {
    fetchAssets();
    return () => { abortRef.current?.abort(); };
  }, [fetchAssets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets(search);
  };

  return (
    <div>
      <div className="page-header">
        <Package size={20} color="var(--luz-gold)" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Ativos
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} aria-label="Novo Ativo">
          <Plus size={16} aria-hidden /> Novo Ativo
        </button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value as AssetType | '')} style={{ width: 'auto', minWidth: 130 }}>
            <option value="">Todos os tipos</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as AssetStatus | '')} style={{ width: 'auto', minWidth: 130 }}>
            <option value="">Todos os status</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ flex: 1 }}
            aria-label="Buscar ativo"
          />
          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Buscar">
            <Search size={16} aria-hidden /> Buscar
          </button>
        </form>

        {/* States */}
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando ativos...</p>
          </div>
        ) : error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Package size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>{error}</p>
            <button type="button" className="btn btn-ghost" onClick={() => fetchAssets()} style={{ marginTop: 12 }}>
              Tentar novamente
            </button>
          </div>
        ) : assets.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Package size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhum ativo cadastrado</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>
              Cadastre equipamentos, protocolos, contratos e outros ativos.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }} aria-label="Cadastrar primeiro ativo">
              <Plus size={16} aria-hidden /> Cadastrar primeiro ativo
            </button>
          </div>
        ) : (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assets.map(asset => (
              <div
                key={asset.id}
                className="card animate-fade-in-up"
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(201,164,74,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Package size={18} color="var(--luz-gold)" aria-hidden />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: 'var(--luz-white)' }}>{asset.name}</span>
                    <span className="badge badge-novo">{TYPE_LABELS[asset.type]}</span>
                    <span className={`badge ${asset.status === 'ativo' ? 'badge-convertido' : asset.status === 'expirado' ? 'badge-perdido' : 'badge-contato'}`}>
                      {STATUS_LABELS[asset.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
                    {asset.value != null && asset.value > 0 && <>{BRL.format(asset.value)} &middot; </>}
                    {asset.acquisition_date && <>Adquirido em {new Date(asset.acquisition_date).toLocaleDateString('pt-BR')}</>}
                    {asset.expiration_date && <> &middot; Expira {new Date(asset.expiration_date).toLocaleDateString('pt-BR')}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Asset Modal */}
      {showModal && (
        <NewAssetModal
          token={token}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchAssets(); }}
        />
      )}
    </div>
  );
}

// ── Modal ──

interface ModalProps {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}

function NewAssetModal({ token, onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({
    name: '', type: '' as AssetType | '', status: 'ativo' as AssetStatus,
    value: '', acquisition_date: '', expiration_date: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { setError('Nome deve ter pelo menos 2 caracteres.'); return; }
    if (!form.type) { setError('Selecione o tipo do ativo.'); return; }
    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        type: form.type,
        status: form.status,
      };
      if (form.value) body.value = Number(form.value);
      if (form.acquisition_date) body.acquisition_date = form.acquisition_date;
      if (form.expiration_date) body.expiration_date = form.expiration_date;
      if (form.description) body.description = form.description;

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erro ao criar ativo.');
        return;
      }
      onCreated();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div
        className="card animate-fade-in-up"
        style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--luz-white)', margin: 0 }}>Novo Ativo</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </div>

        {error && <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="asset-name" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Nome *</label>
            <input id="asset-name" name="name" className="form-input" value={form.name} onChange={handleChange} required autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="asset-type" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Tipo *</label>
              <select id="asset-type" name="type" className="form-input" value={form.type} onChange={handleChange} required>
                <option value="">Selecione</option>
                {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="asset-status" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Status</label>
              <select id="asset-status" name="status" className="form-input" value={form.status} onChange={handleChange}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="asset-value" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Valor (R$)</label>
            <input id="asset-value" name="value" type="number" step="0.01" min="0" className="form-input" value={form.value} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="asset-acq" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Data Aquisição</label>
              <input id="asset-acq" name="acquisition_date" type="date" className="form-input" value={form.acquisition_date} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="asset-exp" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Data Expiração</label>
              <input id="asset-exp" name="expiration_date" type="date" className="form-input" value={form.expiration_date} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label htmlFor="asset-desc" style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginBottom: 4, display: 'block' }}>Descrição</label>
            <textarea id="asset-desc" name="description" className="form-input" rows={3} value={form.description} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Salvando...' : 'Criar Ativo'}
          </button>
        </form>
      </div>
    </div>
  );
}
