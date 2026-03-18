import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { Patient } from '@shared/types';

function age(birth_date: string): string {
  const years = Math.floor((Date.now() - new Date(birth_date).getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${years} anos`;
}

export default function PatientsPage() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchPatients = useCallback(async (q?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!res.ok) {
        setError('Erro ao carregar pacientes.');
        setPatients([]);
        return;
      }

      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Erro de conexão com o servidor.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchPatients();
    return () => { abortRef.current?.abort(); };
  }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <div>
      <div className="page-header">
        <Users size={20} color="var(--luz-gold)" aria-hidden />
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Pacientes
          </div>
        </div>
        <Link to="/patients/new" className="btn btn-primary btn-sm" aria-label="Novo Paciente">
          <Plus size={16} aria-hidden /> Novo Paciente
        </Link>
      </div>

      <div className="page-content">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ flex: 1 }}
            aria-label="Buscar paciente"
          />
          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Buscar">
            <Search size={16} aria-hidden /> Buscar
          </button>
        </form>

        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" aria-hidden />
            <p>Carregando pacientes...</p>
          </div>
        ) : error ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Users size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Erro</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>{error}</p>
            <button type="button" className="btn btn-ghost" onClick={() => fetchPatients()} style={{ marginTop: 12 }}>
              Tentar novamente
            </button>
          </div>
        ) : patients.length === 0 ? (
          <div className="card animate-fade-in-up agenda-empty-state">
            <Users size={48} color="var(--luz-gold)" aria-hidden />
            <h3 className="exam-section-title">Nenhum paciente cadastrado</h3>
            <p style={{ color: 'var(--luz-gray-dark)' }}>
              Não existem pacientes cadastrados, cadastrar o primeiro
            </p>
            <Link to="/patients/new" className="btn btn-primary" style={{ marginTop: 16 }} aria-label="Cadastrar primeiro paciente">
              <Plus size={16} aria-hidden /> Cadastrar primeiro paciente
            </Link>
          </div>
        ) : (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patients.map(p => (
              <Link
                key={p.id}
                to={`/patients/${p.id}`}
                className="card animate-fade-in-up"
                style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}
                aria-label={`Ver paciente ${p.name}`}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(201,164,74,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontFamily: 'Orbitron', fontWeight: 700
                }} className="font-display" aria-hidden>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--luz-white)', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
                    {age(p.birth_date)} &middot; {p.phone || 'Sem telefone'}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--luz-gray-dark)" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
