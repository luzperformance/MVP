import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wand2, Save, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { SOAPNote } from '@shared/types';

type Source = 'manual' | 'transcricao' | 'resumo';

const SOAP_LABELS: Record<keyof SOAPNote, string> = {
  soap_subjective: 'S — Subjetivo (queixa e história)',
  soap_objective: 'O — Objetivo (exame e dados)',
  soap_assessment: 'A — Avaliação e diagnóstico',
  soap_plan: 'P — Plano de tratamento',
};

const TABS: { key: Source; label: string }[] = [
  { key: 'transcricao', label: 'Transcrição Meet' },
  { key: 'resumo', label: 'Resumo' },
  { key: 'manual', label: 'Manual' },
];

export default function NewRecordPage() {
  const { id: patientId } = useParams();
  const token = useAuthStore(s => s.token);
  const navigate = useNavigate();

  const [source, setSource] = useState<Source>('manual');
  const [rawInput, setRawInput] = useState('');
  const [consulting_date, setConsultationDate] = useState(() =>
    new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('teleconsulta');
  const [soap, setSoap] = useState<SOAPNote>({
    soap_subjective: '', soap_objective: '', soap_assessment: '', soap_plan: '',
  });
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [aiError, setAiError] = useState('');

  const processWithAI = async () => {
    if (!rawInput.trim()) return;
    setProcessing(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ raw_input: rawInput }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setAiError(body?.error || 'Erro ao processar com IA.');
        return;
      }
      const data = await res.json();
      setSoap(data);
    } catch {
      setAiError('Erro de conexão com o serviço de IA.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type, source,
          raw_input: source !== 'manual' ? rawInput : null,
          ...soap,
          consultation_date: consulting_date,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError(body?.error || 'Erro ao salvar consulta.');
        return;
      }
      navigate(`/patients/${patientId}`);
    } catch {
      setSaveError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm" aria-label="Voltar">
          <ArrowLeft size={16} aria-hidden />
        </Link>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Nova Consulta
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          <Save size={14} aria-hidden /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <label htmlFor="record-date" className="form-label">Data da Consulta</label>
            <input id="record-date" type="date" className="form-input" value={consulting_date}
              onChange={e => setConsultationDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="record-type" className="form-label">Tipo</label>
            <select id="record-type" className="form-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="teleconsulta">Teleconsulta</option>
              <option value="consulta">Consulta presencial</option>
              <option value="retorno">Retorno</option>
              <option value="exame">Análise de exame</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSource(t.key)}
              className={`btn btn-sm ${source === t.key ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {source !== 'manual' && (
          <div className="card animate-fade-in-up">
            <label htmlFor="raw-input" className="form-label">
              {source === 'transcricao' ? 'Cole a transcrição aqui' : 'Cole o resumo da consulta'}
            </label>
            <textarea
              id="raw-input"
              className="form-input"
              style={{ minHeight: 200 }}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={source === 'transcricao'
                ? 'Cole aqui a transcrição completa do Google Meet...'
                : 'Cole o resumo ou notas da consulta...'}
            />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={processWithAI} disabled={processing || !rawInput.trim()}>
                {processing
                  ? <><Loader size={14} style={{ animation: 'finance-spin 1s linear infinite' }} aria-hidden /> Processando...</>
                  : <><Wand2 size={14} aria-hidden /> Processar com IA</>}
              </button>
              {aiError && <span style={{ color: 'var(--luz-danger)', fontSize: 12 }}>{aiError}</span>}
              {!aiError && soap.soap_subjective && (
                <span style={{ color: 'var(--luz-success)', fontSize: 12 }}>SOAP preenchido pela IA — revise abaixo</span>
              )}
            </div>
          </div>
        )}

        <div className="card animate-fade-in-up">
          <h3 className="exam-section-title" style={{ marginBottom: 20 }}>Prontuário SOAP</h3>
          {(Object.keys(SOAP_LABELS) as (keyof SOAPNote)[]).map((field) => (
            <div key={field} style={{ marginBottom: 20 }}>
              <label htmlFor={field} className="form-label">{SOAP_LABELS[field]}</label>
              <textarea
                id={field}
                className="form-input"
                style={{ minHeight: 100 }}
                value={soap[field]}
                onChange={e => setSoap(s => ({ ...s, [field]: e.target.value }))}
                placeholder={`Preencha o campo ${SOAP_LABELS[field].split(' — ')[0]}...`}
              />
            </div>
          ))}
        </div>

        {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}
      </div>
    </div>
  );
}
