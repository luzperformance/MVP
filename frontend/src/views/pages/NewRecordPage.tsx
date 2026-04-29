import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Save, Loader, FileText, ChevronDown, ChevronUp,
  Brain, RefreshCw, AlertTriangle, Stethoscope, ClipboardList, Activity, Pill
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { SOAPNote } from '@shared/types';
import EventFormModal from '../../components/calendar/EventFormModal';

type Source = 'manual' | 'transcricao' | 'resumo';

function renderMarkdownSections(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentSection: string | null = null;
  let sectionLines: string[] = [];
  let key = 0;

  const flushSection = () => {
    if (sectionLines.length === 0) return;
    const content = sectionLines.join('\n').trim();
    if (!content) return;

    const sectionIcons: Record<string, React.ReactNode> = {
      'exame': <Activity size={14} />,
      'prescri': <Pill size={14} />,
      'observ': <ClipboardList size={14} />,
      'tempo': <Stethoscope size={14} />,
    };

    let icon: React.ReactNode = <FileText size={14} />;
    if (currentSection) {
      const lower = currentSection.toLowerCase();
      for (const [keyword, ic] of Object.entries(sectionIcons)) {
        if (lower.includes(keyword)) { icon = ic; break; }
      }
    }

    elements.push(
      <div key={key++} style={{ marginBottom: 16 }}>
        {currentSection && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            color: 'var(--luz-gold)', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {icon}
            {currentSection.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
          </div>
        )}
        <div style={{ color: 'var(--luz-gray)', fontSize: 13, lineHeight: 1.7 }}>
          {content.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            const isBullet = line.trimStart().startsWith('-') || line.trimStart().startsWith('•');
            return (
              <div key={i} style={{
                margin: isBullet ? '3px 0' : '6px 0',
                paddingLeft: isBullet ? 12 : 0,
                position: 'relative',
              }}>
                {isBullet && (
                  <span style={{
                    position: 'absolute', left: 0, top: 7,
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--luz-gold)', opacity: 0.6,
                  }} />
                )}
                {parts.map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} style={{ color: 'var(--luz-white)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                    : <span key={j}>{isBullet && j === 0 ? part.replace(/^\s*[-•]\s*/, '') : part}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
    sectionLines = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line) || /^\*\*\d+\./.test(line)) {
      flushSection();
      currentSection = line;
    } else {
      sectionLines.push(line);
    }
  }
  flushSection();
  return elements;
}

const SOAP_LABELS: Record<keyof SOAPNote, string> = {
  soap_subjective: 'S — Subjetivo (queixa e história)',
  soap_objective: 'O — Objetivo (exame e dados)',
  soap_assessment: 'A — Avaliação e diagnóstico',
  soap_plan: 'P — Plano de tratamento',
};

const SOAP_ICONS: Record<keyof SOAPNote, React.ReactNode> = {
  soap_subjective: <ClipboardList size={14} />,
  soap_objective: <Activity size={14} />,
  soap_assessment: <Brain size={14} />,
  soap_plan: <Pill size={14} />,
};

const TABS: { key: Source; label: string; icon: React.ReactNode }[] = [
  { key: 'transcricao', label: 'Transcrição Meet', icon: <Stethoscope size={14} /> },
  { key: 'resumo', label: 'Resumo', icon: <FileText size={14} /> },
  { key: 'manual', label: 'Manual', icon: <ClipboardList size={14} /> },
];

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 6,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(201,164,74,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease infinite',
            width: i === lines - 1 ? '60%' : `${85 + Math.random() * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

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
  const [preConsultSummary, setPreConsultSummary] = useState<string | null>(null);
  const [preConsultLoading, setPreConsultLoading] = useState(true);
  const [preConsultError, setPreConsultError] = useState('');
  const [preConsultExpanded, setPreConsultExpanded] = useState(true);

  const [scheduleReturn, setScheduleReturn] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const loadPreConsult = useCallback(() => {
    if (!patientId || !token) return;
    setPreConsultLoading(true);
    setPreConsultError('');
    setPreConsultSummary(null);
    fetch(`/api/patients/${patientId}/pre-consult-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Paciente não encontrado' : 'Erro ao carregar resumo');
        return res.json();
      })
      .then((data) => setPreConsultSummary(data.summary || ''))
      .catch((err) => setPreConsultError(err.message || 'Erro ao gerar resumo pré-consulta'))
      .finally(() => setPreConsultLoading(false));
  }, [patientId, token]);

  useEffect(() => { loadPreConsult(); }, [loadPreConsult]);

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
      
      if (scheduleReturn) {
        setShowEventModal(true);
      } else {
        navigate(`/patients/${patientId}`);
      }
    } catch {
      setSaveError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header glass-surface" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            to={`/patients/${patientId}`}
            className="btn btn-ghost btn-sm"
            aria-label="Voltar"
            style={{ padding: 0, width: 32, height: 32, minWidth: 32 }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-gold-gradient" style={{ fontSize: 16, margin: 0 }}>
              Nova Consulta
            </h1>
            <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 2 }}>
              Prontuário Digital
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
          style={{ gap: 6 }}
        >
          {saving
            ? <><Loader size={14} style={{ animation: 'finance-spin 1s linear infinite' }} /> Salvando...</>
            : <><Save size={14} /> Salvar Consulta</>
          }
        </button>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Resumo Pré-Consulta */}
        <section className="card glass-card animate-fade-in-up" style={{ overflow: 'hidden', padding: 0 }}>
          <button
            type="button"
            onClick={() => setPreConsultExpanded((e) => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '16px 20px',
              background: preConsultExpanded
                ? 'linear-gradient(135deg, rgba(201,164,74,0.08) 0%, transparent 100%)'
                : 'transparent',
              border: 'none', color: 'var(--luz-white)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.3s ease',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--luz-gold-dark), var(--luz-gold-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Brain size={16} color="var(--luz-bg)" />
            </div>
            <div style={{ flex: 1 }}>
              <span className="font-display" style={{
                fontSize: 12, textTransform: 'uppercase',
                color: 'var(--luz-gold)', letterSpacing: '0.06em',
              }}>
                Resumo Pré-Consulta
              </span>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', marginTop: 1 }}>
                Gerado por IA com base no histórico do paciente
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--luz-gray-dark)',
            }}>
              {preConsultLoading && (
                <span style={{ fontSize: 10, color: 'var(--luz-gold)', opacity: 0.7 }}>
                  Gerando...
                </span>
              )}
              {preConsultExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          <div style={{
            maxHeight: preConsultExpanded ? 600 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div style={{
              padding: '0 20px 20px',
              borderTop: '1px solid rgba(201,164,74,0.12)',
            }}>
              {preConsultLoading && <SkeletonBlock lines={6} />}

              {preConsultError && !preConsultLoading && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 0', flexWrap: 'wrap',
                }}>
                  <AlertTriangle size={16} color="var(--luz-danger)" style={{ opacity: 0.7 }} />
                  <span style={{ color: 'var(--luz-gray-dark)', fontSize: 13, flex: 1 }}>
                    {preConsultError}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={loadPreConsult}
                    style={{ fontSize: 12, gap: 6 }}
                  >
                    <RefreshCw size={12} /> Tentar novamente
                  </button>
                </div>
              )}

              {preConsultSummary && !preConsultLoading && (
                <div style={{ paddingTop: 12 }}>
                  {renderMarkdownSections(preConsultSummary)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tipo e Data */}
        <div className="card glass-card animate-fade-in-up" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, animationDelay: '60ms',
        }}>
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

        {/* Source Tabs */}
        <div className="animate-fade-in-up" style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', animationDelay: '120ms',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSource(t.key)}
              className={`btn btn-sm ${source === t.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                gap: 6,
                ...(source === t.key ? {
                  boxShadow: '0 0 20px rgba(201,164,74,0.15)',
                } : {}),
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Transcription/Summary input */}
        {source !== 'manual' && (
          <div className="card glass-card animate-fade-in-up">
            <label htmlFor="raw-input" className="form-label">
              {source === 'transcricao' ? 'Cole a transcrição aqui' : 'Cole o resumo da consulta'}
            </label>
            <textarea
              id="raw-input"
              className="form-input"
              style={{ minHeight: 200, resize: 'vertical' }}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={source === 'transcricao'
                ? 'Cole aqui a transcrição completa do Google Meet...'
                : 'Cole o resumo ou notas da consulta...'}
            />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={processWithAI}
                disabled={processing || !rawInput.trim()}
                style={{ gap: 6 }}
              >
                {processing
                  ? <><Loader size={14} style={{ animation: 'finance-spin 1s linear infinite' }} /> Processando...</>
                  : <><Wand2 size={14} /> Processar com IA</>}
              </button>
              {aiError && (
                <span style={{ color: 'var(--luz-danger)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> {aiError}
                </span>
              )}
              {!aiError && soap.soap_subjective && (
                <span style={{ color: 'var(--luz-success)', fontSize: 12 }}>
                  SOAP preenchido pela IA — revise abaixo
                </span>
              )}
            </div>
          </div>
        )}

        {/* SOAP Fields */}
        <div className="card glass-card animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Stethoscope size={18} color="var(--luz-gold)" />
            <h3 className="font-display" style={{
              fontSize: 13, margin: 0, textTransform: 'uppercase',
              color: 'var(--luz-gold)', letterSpacing: '0.04em',
            }}>
              Prontuário SOAP
            </h3>
          </div>
          {(Object.keys(SOAP_LABELS) as (keyof SOAPNote)[]).map((field) => (
            <div key={field} style={{ marginBottom: 20 }}>
              <label htmlFor={field} className="form-label" style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: 'var(--luz-gold)', display: 'flex' }}>{SOAP_ICONS[field]}</span>
                {SOAP_LABELS[field]}
              </label>
              <textarea
                id={field}
                className="form-input"
                style={{ minHeight: 100, resize: 'vertical' }}
                value={soap[field]}
                onChange={e => setSoap(s => ({ ...s, [field]: e.target.value }))}
                placeholder={`Preencha o campo ${SOAP_LABELS[field].split(' — ')[0]}...`}
              />
            </div>
          ))}
        </div>

        <div className="card glass-card animate-fade-in-up" style={{ animationDelay: '200ms', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input 
            type="checkbox" 
            id="schedule-return" 
            checked={scheduleReturn} 
            onChange={(e) => setScheduleReturn(e.target.checked)} 
            style={{ width: 18, height: 18, accentColor: 'var(--luz-gold)' }} 
          />
          <label htmlFor="schedule-return" style={{ color: 'var(--luz-white)', fontSize: 14, cursor: 'pointer', flex: 1 }}>
            Agendar retorno após salvar consulta
          </label>
        </div>

        {saveError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--luz-danger)', fontSize: 13,
          }} role="alert">
            <AlertTriangle size={14} /> {saveError}
          </div>
        )}
      </div>

      <EventFormModal 
        isOpen={showEventModal} 
        onClose={() => navigate(`/patients/${patientId}`)} 
        onSuccess={() => navigate(`/patients/${patientId}`)}
        prefill={{ 
          summary: 'Retorno de Consulta',
          description: `ID Paciente: ${patientId}`
        }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
