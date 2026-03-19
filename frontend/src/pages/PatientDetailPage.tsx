import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FlaskConical, Camera, FileText, User, Phone, Mail, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { Patient } from '@shared/types';
import DashboardBIContainer from '../components/bi/DashboardBIContainer';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (res.status === 404) {
        setError('Paciente não encontrado.');
        return;
      }

      if (!res.ok) {
        setError('Erro ao carregar dados do paciente.');
        return;
      }

      const data = await res.json();
      setPatient(data);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [id, token, logout, navigate]);

  useEffect(() => {
    fetchPatient();
    return () => { abortRef.current?.abort(); };
  }, [fetchPatient]);

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch { return dateStr; }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <Link to="/patients" className="btn btn-ghost btn-sm" aria-label="Voltar"><ArrowLeft size={16} aria-hidden /></Link>
          <span className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', flex: 1 }}>Paciente</span>
        </div>
        <div className="page-content">
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div>
        <div className="page-header">
          <Link to="/patients" className="btn btn-ghost btn-sm" aria-label="Voltar"><ArrowLeft size={16} aria-hidden /></Link>
          <span className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', flex: 1 }}>Paciente</span>
        </div>
        <div className="page-content">
          <div className="card animate-fade-in-up agenda-empty-state">
            <User size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>{error || 'Paciente não encontrado.'}</p>
            <Link to="/patients" className="btn btn-ghost" style={{ marginTop: 12 }}>Voltar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/patients" className="btn btn-ghost btn-sm" aria-label="Voltar para lista"><ArrowLeft size={16} aria-hidden /></Link>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            {patient.name}
          </div>
        </div>
        <Link to={`/patients/${id}/records/new`} className="btn btn-primary btn-sm" aria-label="Nova Consulta">
          <Plus size={16} aria-hidden /> Consulta
        </Link>
      </div>

      <div className="page-content">
        <div className="card card-gold animate-fade-in-up" style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={16} color="var(--luz-gold)" aria-hidden />
              <div>
                <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nascimento</div>
                <div style={{ fontSize: 14, color: 'var(--luz-white)', fontWeight: 500 }}>{formatDate(patient.birth_date)}</div>
              </div>
            </div>
            {patient.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="var(--luz-gold)" aria-hidden />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</div>
                  <div style={{ fontSize: 14, color: 'var(--luz-white)', fontWeight: 500 }}>{patient.phone}</div>
                </div>
              </div>
            )}
            {patient.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="var(--luz-gold)" aria-hidden />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</div>
                  <div style={{ fontSize: 14, color: 'var(--luz-white)', fontWeight: 500 }}>{patient.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to={`/patients/${id}/records/new`} className="btn btn-secondary btn-sm" aria-label="Nova Consulta">
            <FileText size={14} aria-hidden /> Nova Consulta
          </Link>
          <Link to={`/patients/${id}/exams`} className="btn btn-secondary btn-sm" aria-label="Exames">
            <FlaskConical size={14} aria-hidden /> Exames
          </Link>
          <Link to={`/patients/${id}/photos`} className="btn btn-secondary btn-sm" aria-label="Fotos">
            <Camera size={14} aria-hidden /> Fotos
          </Link>
        </div>

        {/* BI Dashboard Module */}
        <DashboardBIContainer patientId={id!} />
      </div>
    </div>
  );
}
