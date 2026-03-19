import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, User, Calendar, History, Phone, Mail, FlaskConical, Camera } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { Patient, Record } from '@shared/types';
import DashboardBIContainer from '../components/bi/DashboardBIContainer';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!patient) return <div className="page-content">Paciente não encontrado.</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header glass-surface" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ padding: 0, width: 32, height: 32, minWidth: 32 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-gold-gradient" style={{ fontSize: 18, margin: 0 }}>{patient.name}</h1>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>Prontuário Digital | ID: {patient.id.slice(0,8)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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

        {/* Sidebar: Summary/Stats */}
        <aside className="stagger-sections">
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
