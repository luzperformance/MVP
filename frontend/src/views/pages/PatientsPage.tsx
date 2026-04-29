import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight, Stethoscope, ClipboardList, Brain, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import type { Patient } from '@shared/types';
import NewPatientModal from '@/views/components/patients/NewPatientModal';

const AGE_LABEL_NA = 'N/A';

function age(birth_date: string): string {
  if (!birth_date) return AGE_LABEL_NA;
  const years = Math.floor((Date.now() - new Date(birth_date).getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${years} anos`;
}

const PatientCard = React.memo(({ p, idx }: { p: Patient; idx: number }) => (
  <Link
    to={`/patients/${p.id}`}
    className={`card glass-card animate-fade-in-up stagger-${(idx % 6) + 1}`}
    style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', padding: 20 }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '12px',
        background: 'rgba(201,164,74,0.1)',
        border: '1px solid rgba(201,164,74,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--luz-gold)',
        fontSize: 18,
        fontWeight: 700,
      }}
      className="font-display"
    >
      {p.name.charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontWeight: 600,
          color: 'var(--luz-white)',
          fontSize: 15,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {p.name}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="badge badge-novo" style={{ fontSize: 10, padding: '2px 8px' }}>
          Ativo
        </span>
        <span style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>{age(p.birth_date)}</span>
      </div>
    </div>
    <ChevronRight size={18} color="rgba(201,164,74,0.4)" />
  </Link>
));

export default function PatientsPage() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchPatients = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Erro ao carregar pacientes.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header glass-surface">
        <Users size={20} color="var(--luz-gold)" className="animate-pulse-glow" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display text-gold-gradient" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>
            Base de Pacientes
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)', fontWeight: 500 }}>
            Gestão e busca de prontuários
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Novo Paciente
        </button>
      </div>

      <div className="page-content grid-pattern">
        {/* Search Bar */}
        <div className="card glass-card" style={{ marginBottom: 24, padding: '12px 16px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="var(--luz-gray-dark)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
                style={{ width: '100%', paddingLeft: 44, background: 'rgba(255,255,255,0.02)' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ minWidth: 100 }}>
              Pesquisar
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="finance-loading-spinner" />
          </div>
        ) : error ? (
          <div className="card glass-card" style={{ textAlign: 'center', padding: 48 }}>
            <h3 className="font-display" style={{ color: 'var(--luz-danger)' }}>Ops! {error}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchPatients()} style={{ marginTop: 16 }}>Tentar Novamente</button>
          </div>
        ) : patients.length === 0 ? (
          search ? (
            /* Empty search results */
            <div className="card glass-card animate-fade-in-up" style={{ textAlign: 'center', padding: 56 }}>
              <Search size={40} color="rgba(201,164,74,0.2)" style={{ marginBottom: 16 }} />
              <h3 className="font-display" style={{ fontSize: 15, color: 'var(--luz-white)', marginBottom: 8 }}>
                Nenhum resultado para "{search}"
              </h3>
              <p style={{ color: 'var(--luz-gray-dark)', fontSize: 13, marginBottom: 24 }}>
                Tente buscar pelo nome completo ou confira a ortografia.
              </p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(''); fetchPatients(); }}
              >
                Limpar busca
              </button>
            </div>
          ) : (
            /* True empty state — no patients at all */
            <div className="animate-fade-in-up" style={{ maxWidth: 560, margin: '0 auto' }}>
              {/* Hero card */}
              <div className="card glass-card" style={{
                textAlign: 'center',
                padding: '48px 40px 40px',
                marginBottom: 20,
                background: 'linear-gradient(160deg, rgba(201,164,74,0.06) 0%, rgba(14,14,18,0.95) 60%)',
                border: '1px solid rgba(201,164,74,0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative rings */}
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 200, height: 200, borderRadius: '50%',
                  border: '1px solid rgba(201,164,74,0.06)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 140, height: 140, borderRadius: '50%',
                  border: '1px solid rgba(201,164,74,0.1)',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(201,164,74,0.15), rgba(201,164,74,0.05))',
                  border: '1px solid rgba(201,164,74,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <Users size={32} color="var(--luz-gold)" strokeWidth={1.5} />
                </div>

                <h2 className="font-display" style={{
                  fontSize: 20, fontWeight: 700, color: 'var(--luz-white)',
                  marginBottom: 12, letterSpacing: '0.02em',
                }}>
                  Sua base de pacientes está vazia
                </h2>
                <p style={{
                  color: 'var(--luz-gray-dark)', fontSize: 14, lineHeight: 1.7,
                  marginBottom: 32, maxWidth: 380, margin: '0 auto 32px',
                }}>
                  Cadastre seu primeiro paciente e comece a usar prontuário digital,
                  IA pré-consulta e acompanhamento completo de resultados.
                </p>

                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary"
                  style={{ gap: 8, padding: '12px 28px', fontSize: 14 }}
                >
                  <Plus size={18} />
                  Cadastrar Primeiro Paciente
                </button>
              </div>

              {/* Feature pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { icon: <ClipboardList size={16} />, label: 'Prontuário SOAP', desc: 'Registros estruturados' },
                  { icon: <Brain size={16} />, label: 'Resumo com IA', desc: 'Pré-consulta inteligente' },
                  { icon: <Stethoscope size={16} />, label: 'Exames e labs', desc: 'Histórico completo' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="card glass-card" style={{
                    padding: '14px 12px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ color: 'var(--luz-gold)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                      {icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--luz-white)', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--luz-gray-dark)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {patients.map((p, idx) => (
              <PatientCard key={p.id} p={p} idx={idx} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewPatientModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            fetchPatients();
          }} 
        />
      )}
    </div>
  );
}
