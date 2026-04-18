import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, User, Calendar, History, Phone, Mail, FlaskConical, Camera, Brain, Loader, RefreshCw, AlertTriangle, ChevronUp, ChevronDown, Activity, Pill, ClipboardList, Stethoscope } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { Patient, Record as MedicalRecord } from '@shared/types';
import DashboardBIContainer from '../components/bi/DashboardBIContainer';

function renderMarkdownSections(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentSection: string | null = null;
  let sectionLines: string[] = [];
  let key = 0;

  const sectionIcons: Record<string, React.ReactNode> = {
    'exame': <Activity size={14} />,
    'prescri': <Pill size={14} />,
    'observ': <ClipboardList size={14} />,
    'tempo': <Stethoscope size={14} />,
  };

  const flushSection = () => {
    if (sectionLines.length === 0) return;
    const content = sectionLines.join('\n').trim();
    if (!content) return;

    let icon: React.ReactNode = <FileText size={14} />;
    if (currentSection) {
      const lower = currentSection.toLowerCase();
      for (const [kw, ic] of Object.entries(sectionIcons)) {
        if (lower.includes(kw)) { icon = ic; break; }
      }
    }

    elements.push(
      <div key={key++} style={{ marginBottom: 14 }}>
        {currentSection && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
            color: 'var(--luz-gold)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {icon}
            {currentSection.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
          </div>
        )}
        <div style={{ color: 'var(--luz-gray)', fontSize: 13, lineHeight: 1.6 }}>
          {content.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            const isBullet = line.trimStart().startsWith('-') || line.trimStart().startsWith('•');
            return (
              <div key={i} style={{
                margin: isBullet ? '2px 0' : '4px 0',
                paddingLeft: isBullet ? 10 : 0,
                position: 'relative',
              }}>
                {isBullet && (
                  <span style={{
                    position: 'absolute', left: 0, top: 7,
                    width: 3, height: 3, borderRadius: '50%',
                    background: 'var(--luz-gold)', opacity: 0.5,
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

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [pRes, rRes] = await Promise.all([
          axios.get(`/api/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`/api/patients/${id}/records`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setPatient(pRes.data);
        setRecords(rRes.data);
      } catch (err) {
        console.error('Error loading patient details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="finance-loading-spinner" />
    </div>
  );

  const loadAiSummary = () => {
    if (!id || !token) return;
    setAiLoading(true);
    setAiError('');
    setAiExpanded(true);
    fetch(`/api/patients/${id}/pre-consult-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao gerar resumo');
        return res.json();
      })
      .then((data) => setAiSummary(data.summary || ''))
      .catch((err) => setAiError(err.message))
      .finally(() => setAiLoading(false));
  };

  if (!patient) return <div className="page-content">Paciente não encontrado.</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header glass-surface" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ padding: 0, width: 32, height: 32, minWidth: 32 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-gold-gradient" style={{ fontSize: 18, margin: 0 }}>{patient.name}</h1>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>Prontuário Digital | ID: {patient.id.slice(0,8)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={loadAiSummary}
            disabled={aiLoading}
            style={{ gap: 6, color: 'var(--luz-gold)', border: '1px solid rgba(201,164,74,0.3)' }}
            title="Gerar resumo pré-consulta com IA"
          >
            {aiLoading
              ? <Loader size={14} style={{ animation: 'finance-spin 1s linear infinite' }} />
              : <Brain size={14} />
            }
            Resumo IA
          </button>
          <Link to={`/patients/${id}/records/new`} className="btn btn-primary btn-sm">
            <Plus size={16} /> Novo Registro
          </Link>
          <Link to={`/patients/${id}/exams`} className="btn btn-secondary btn-sm">
            <FileText size={16} /> Bioconv
          </Link>
        </div>
      </div>

      <div className="page-content grid-pattern" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24 }}>
        {/* Main Content: Info + Timeline + BI */}
        <div className="stagger-sections">
          {/* Info Card */}
          <section className="card glass-card animate-fade-in-up" style={{ marginBottom: 24, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <User size={18} color="var(--luz-gold)" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase' }}>Informações Base</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
              <div>
                <label className="form-label-sm">Nascimento</label>
                <div style={{ color: 'var(--luz-white)', fontWeight: 600 }}>
                  {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div>
                <label className="form-label-sm">Telefone</label>
                <div style={{ color: 'var(--luz-white)', fontWeight: 600 }}>{patient.phone || '—'}</div>
              </div>
              <div>
                <label className="form-label-sm">Email</label>
                <div style={{ color: 'var(--luz-white)', fontWeight: 600 }}>{patient.email || '—'}</div>
              </div>
            </div>
          </section>

          {/* Quick Actions for Tools */}
          <div className="card glass-card animate-fade-in-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, padding: 16 }}>
            <Link to={`/patients/${id}/exams`} className="btn btn-ghost btn-sm">
              <FlaskConical size={14} /> Exames
            </Link>
            <Link to={`/patients/${id}/photos`} className="btn btn-ghost btn-sm">
              <Camera size={14} /> Fotos
            </Link>
          </div>

          {/* BI Dashboard Module */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms', marginBottom: 24 }}>
            <DashboardBIContainer patientId={id!} />
          </div>

          {/* Timeline Section */}
          <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <History size={18} color="var(--luz-gold)" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase' }}>Histórico Clínico</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger">
              {records.length === 0 ? (
                <div className="card glass-card" style={{ textAlign: 'center', color: 'var(--luz-gray-dark)', fontSize: 13 }}>
                  Nenhum registro encontrado.
                </div>
              ) : (
                records.map((r, idx) => (
                  <div key={r.id} className={`card glass-card animate-fade-in-up stagger-${idx + 1}`} style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--luz-gold)', fontWeight: 600 }}>
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="badge badge-novo" style={{ fontSize: 10 }}>Consulta</span>
                    </div>
                    <div style={{ color: 'var(--luz-gray)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.content}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: AI Summary + Stats */}
        <aside className="stagger-sections">
          {/* AI Pre-Consult Summary */}
          {(aiSummary || aiLoading || aiError) && (
            <div className="card glass-card animate-fade-in-up" style={{ marginBottom: 16, overflow: 'hidden', padding: 0 }}>
              <button
                type="button"
                onClick={() => setAiExpanded((e) => !e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '14px 16px',
                  background: aiExpanded
                    ? 'linear-gradient(135deg, rgba(201,164,74,0.1) 0%, transparent 100%)'
                    : 'transparent',
                  border: 'none', color: 'var(--luz-white)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Brain size={14} color="var(--luz-gold)" />
                <span className="font-display" style={{
                  fontSize: 11, textTransform: 'uppercase', flex: 1,
                  color: 'var(--luz-gold)', letterSpacing: '0.05em',
                }}>
                  Resumo IA
                </span>
                {aiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {aiExpanded && (
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid rgba(201,164,74,0.1)',
                  maxHeight: 400, overflowY: 'auto',
                }}>
                  {aiLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          height: 10, borderRadius: 5,
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(201,164,74,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s ease infinite',
                          width: i === 4 ? '55%' : `${75 + Math.random() * 20}%`,
                        }} />
                      ))}
                      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                    </div>
                  )}
                  {aiError && !aiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', flexWrap: 'wrap' }}>
                      <AlertTriangle size={13} color="var(--luz-danger)" style={{ opacity: 0.7 }} />
                      <span style={{ color: 'var(--luz-gray-dark)', fontSize: 12, flex: 1 }}>{aiError}</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={loadAiSummary} style={{ fontSize: 11, gap: 4, padding: '2px 8px' }}>
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  )}
                  {aiSummary && !aiLoading && (
                    <div style={{ paddingTop: 10 }}>
                      {renderMarkdownSections(aiSummary)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="card glass-card animate-fade-in-up" style={{ animationDelay: '300ms', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
               <Calendar size={16} color="var(--luz-gold)" />
               <h3 className="font-display" style={{ fontSize: 13, color: 'var(--luz-gold)', margin: 0, textTransform: 'uppercase' }}>Sumário Rápido</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="glass-surface" style={{ padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Registros</div>
                <div className="font-display" style={{ fontSize: 20, color: 'var(--luz-white)' }}>{records.length}</div>
              </div>
              <div className="glass-surface" style={{ padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>Status Tracking</div>
                <div className="font-display" style={{ fontSize: 14, color: 'var(--luz-white)' }}>
                  {records.length > 0 ? 'Acompanhamento Ativo' : 'Triagem'}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
