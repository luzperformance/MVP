import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wand2, Save, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { SOAPNote } from '../../shared/types';

type Source = 'manual' | 'transcricao' | 'resumo';

export default function NewRecordPage() {
  const { id: patientId } = useParams();
  const { token } = useAuthStore();
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
      const data = await res.json();
      if (!res.ok) { setAiError(data.error); return; }
      setSoap(data);
    } catch { setAiError('Erro de conexão com o serviço de IA.'); }
    finally { setProcessing(false); }
  };

  const handleSave = async () => {
    setSaving(true);
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
    setSaving(false);
    if (res.ok) navigate(`/patients/${patientId}`);
  };

  const tabs: { key: Source; label: string }[] = [
    { key: 'transcricao', label: '🎙 Transcrição Google Meet' },
    { key: 'resumo', label: '📋 Resumo' },
    { key: 'manual', label: '✏️ Manual' },
  ];

  return (
    <div>
      <div className="page-header">
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <span style={{ fontWeight: 700, color: '#fff', flex: 1 }}>Nova Consulta</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Metadata */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label">Data da Consulta</label>
            <input type="date" className="form-input" value={consulting_date}
              onChange={e => setConsultationDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Tipo</label>
            <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="teleconsulta">Teleconsulta</option>
              <option value="consulta">Consulta presencial</option>
              <option value="retorno">Retorno</option>
              <option value="exame">Análise de exame</option>
            </select>
          </div>
        </div>

        {/* Source tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setSource(t.key)}
              className={`btn btn-sm ${source === t.key ? 'btn-primary' : 'btn-ghost'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        {source !== 'manual' && (
          <div className="card">
            <label className="form-label">
              {source === 'transcricao' ? 'Cole a transcrição aqui' : 'Cole o resumo da consulta'}
            </label>
            <textarea
              className="form-input"
              style={{ minHeight: 200 }}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={source === 'transcricao'
                ? 'Cole aqui a transcrição completa do Google Meet...'
                : 'Cole o resumo ou notas da consulta...'}
            />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary" onClick={processWithAI} disabled={processing || !rawInput.trim()}>
                {processing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={14} />}
                {processing ? 'Processando...' : 'Processar com IA'}
              </button>
              {aiError && <span style={{ color: '#ef4444', fontSize: 12 }}>{aiError}</span>}
              {!aiError && soap.soap_subjective && (
                <span style={{ color: '#22c55e', fontSize: 12 }}>✓ SOAP preenchido pela IA — revise abaixo</span>
              )}
            </div>
          </div>
        )}

        {/* SOAP Form */}
        <div className="card">
          <h3 style={{ color: '#c9a44a', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Prontuário SOAP
          </h3>
          {(['soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan'] as const).map((field) => {
            const labels = {
              soap_subjective: 'S — Subjetivo (queixa e história)',
              soap_objective: 'O — Objetivo (exame e dados)',
              soap_assessment: 'A — Avaliação e diagnóstico',
              soap_plan: 'P — Plano de tratamento',
            };
            return (
              <div key={field} style={{ marginBottom: 20 }}>
                <label className="form-label">{labels[field]}</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 100 }}
                  value={soap[field]}
                  onChange={e => setSoap(s => ({ ...s, [field]: e.target.value }))}
                  placeholder={`Preencha o campo ${labels[field].split(' — ')[0]}...`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
