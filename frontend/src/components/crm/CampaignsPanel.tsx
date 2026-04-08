import React, { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { AdCampaign, AdCampaignPlatform, AdCampaignStatus } from '@shared/types';

const PLATFORM_LABELS: Record<AdCampaignPlatform, string> = {
  meta: 'Meta',
  google: 'Google',
  outro: 'Outro',
};

const STATUS_LABELS: Record<AdCampaignStatus, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
};

const PLATFORMS: AdCampaignPlatform[] = ['meta', 'google', 'outro'];
const STATUSES: AdCampaignStatus[] = ['rascunho', 'ativa', 'pausada', 'encerrada'];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface CampaignsPanelProps {
  token: string | null;
  campaigns: AdCampaign[];
  onRefresh: () => void;
}

export default function CampaignsPanel({ token, campaigns, onRefresh }: CampaignsPanelProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState({
    name: '',
    platform: 'outro' as AdCampaignPlatform,
    budget_monthly: '',
    start_date: '',
    end_date: '',
    status: 'rascunho' as AdCampaignStatus,
    notes: '',
  });

  const [editDraft, setEditDraft] = useState<typeof draft | null>(null);

  const resetDraft = () => {
    setDraft({
      name: '',
      platform: 'outro',
      budget_monthly: '',
      start_date: '',
      end_date: '',
      status: 'rascunho',
      notes: '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Informe o nome da campanha.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: draft.name.trim(),
        platform: draft.platform,
        status: draft.status,
      };
      if (draft.budget_monthly) body.budget_monthly = Number(draft.budget_monthly);
      if (draft.start_date) body.start_date = draft.start_date;
      if (draft.end_date) body.end_date = draft.end_date;
      if (draft.notes) body.notes = draft.notes;

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error || 'Erro ao criar campanha.');
        return;
      }
      resetDraft();
      setAdding(false);
      onRefresh();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: AdCampaign) => {
    setEditingId(c.id);
    setEditDraft({
      name: c.name,
      platform: c.platform,
      budget_monthly: c.budget_monthly != null ? String(c.budget_monthly) : '',
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      status: c.status,
      notes: c.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    if (!editDraft.name.trim()) {
      setError('Nome inválido.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: editDraft.name.trim(),
        platform: editDraft.platform,
        status: editDraft.status,
        start_date: editDraft.start_date || null,
        end_date: editDraft.end_date || null,
        notes: editDraft.notes || null,
        budget_monthly: editDraft.budget_monthly ? Number(editDraft.budget_monthly) : null,
      };
      const res = await fetch(`/api/campaigns/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error || 'Erro ao salvar.');
        return;
      }
      cancelEdit();
      onRefresh();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover esta campanha da lista?')) return;
    setError('');
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error || 'Erro ao remover.');
        return;
      }
      if (editingId === id) cancelEdit();
      onRefresh();
    } catch {
      setError('Erro de conexão.');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} color="var(--luz-gold)" aria-hidden />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 14 }}>Campanhas</div>
            <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Registro manual (sem integração com anúncios na v1)</div>
          </div>
        </div>
        {!adding ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)} aria-label="Nova campanha">
            <Plus size={14} aria-hidden /> Nova campanha
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="alert" role="alert" style={{ marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      {adding ? (
        <form onSubmit={handleCreate} style={{ marginBottom: 16, padding: 12, background: 'rgba(201,164,74,0.06)', borderRadius: 'var(--border-radius-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label-sm" htmlFor="camp-name">
                Nome *
              </label>
              <input id="camp-name" className="form-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label-sm" htmlFor="camp-plat">
                Plataforma
              </label>
              <select id="camp-plat" className="form-input" value={draft.platform} onChange={e => setDraft(d => ({ ...d, platform: e.target.value as AdCampaignPlatform }))}>
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label-sm" htmlFor="camp-budget">
                Orç. mensal (R$)
              </label>
              <input id="camp-budget" type="number" step="0.01" min="0" className="form-input" value={draft.budget_monthly} onChange={e => setDraft(d => ({ ...d, budget_monthly: e.target.value }))} />
            </div>
            <div>
              <label className="form-label-sm" htmlFor="camp-start">
                Início
              </label>
              <input id="camp-start" type="date" className="form-input" value={draft.start_date} onChange={e => setDraft(d => ({ ...d, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label-sm" htmlFor="camp-end">
                Fim
              </label>
              <input id="camp-end" type="date" className="form-input" value={draft.end_date} onChange={e => setDraft(d => ({ ...d, end_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label-sm" htmlFor="camp-st">
                Status
              </label>
              <select id="camp-st" className="form-input" value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as AdCampaignStatus }))}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label-sm" htmlFor="camp-notes">
                Notas
              </label>
              <textarea id="camp-notes" className="form-input" rows={2} value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setAdding(false);
                resetDraft();
                setError('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div style={{ overflowX: 'auto' }}>
        <table className="crm-import-table" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Plataforma</th>
              <th>Orç. mês</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--luz-gray-dark)', padding: '20px 8px' }}>
                  Nenhuma campanha cadastrada.
                </td>
              </tr>
            ) : (
              campaigns.map(c =>
                editingId === c.id && editDraft ? (
                  <tr key={c.id}>
                    <td colSpan={7} style={{ padding: 12, background: 'rgba(201,164,74,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                        <input className="form-input" value={editDraft.name} onChange={e => setEditDraft(d => (d ? { ...d, name: e.target.value } : d))} placeholder="Nome" />
                        <select className="form-input" value={editDraft.platform} onChange={e => setEditDraft(d => (d ? { ...d, platform: e.target.value as AdCampaignPlatform } : d))}>
                          {PLATFORMS.map(p => (
                            <option key={p} value={p}>
                              {PLATFORM_LABELS[p]}
                            </option>
                          ))}
                        </select>
                        <input className="form-input" type="number" step="0.01" placeholder="Orç. mensal" value={editDraft.budget_monthly} onChange={e => setEditDraft(d => (d ? { ...d, budget_monthly: e.target.value } : d))} />
                        <input className="form-input" type="date" value={editDraft.start_date} onChange={e => setEditDraft(d => (d ? { ...d, start_date: e.target.value } : d))} />
                        <input className="form-input" type="date" value={editDraft.end_date} onChange={e => setEditDraft(d => (d ? { ...d, end_date: e.target.value } : d))} />
                        <select className="form-input" value={editDraft.status} onChange={e => setEditDraft(d => (d ? { ...d, status: e.target.value as AdCampaignStatus } : d))}>
                          {STATUSES.map(s => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <input className="form-input" style={{ gridColumn: '1 / -1' }} value={editDraft.notes} onChange={e => setEditDraft(d => (d ? { ...d, notes: e.target.value } : d))} placeholder="Notas" />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveEdit()} disabled={saving}>
                          <Check size={14} aria-hidden /> Salvar
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                          <X size={14} aria-hidden /> Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{PLATFORM_LABELS[c.platform]}</td>
                    <td>{c.budget_monthly != null ? BRL.format(Number(c.budget_monthly)) : '—'}</td>
                    <td>{c.start_date ? new Date(c.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{c.end_date ? new Date(c.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className="badge badge-morno" style={{ fontSize: 10 }}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(c)} aria-label="Editar" title="Editar">
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove(c.id)} aria-label="Remover" title="Remover">
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
