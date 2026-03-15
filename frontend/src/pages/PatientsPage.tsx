import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { Patient } from '../../shared/types';

export default function PatientsPage() {
  const { token } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async (q?: string) => {
    const res = await fetch(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const age = (birth_date: string) => {
    const years = Math.floor((Date.now() - new Date(birth_date).getTime()) / (365.25 * 24 * 3600 * 1000));
    return `${years} anos`;
  };

  return (
    <div>
      <div className="page-header">
        <Users size={20} color="#c9a44a" />
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 16, flex: 1 }}>Pacientes</span>
        <Link to="/patients/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> Novo Paciente
        </Link>
      </div>

      <div className="page-content">
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} /> Buscar
          </button>
        </form>

        {/* List */}
        {loading ? (
          <p style={{ color: '#a0a0a0' }}>Carregando...</p>
        ) : patients.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <Users size={40} color="#c9a44a" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#a0a0a0' }}>Nenhum paciente cadastrado ainda.</p>
            <Link to="/patients/new" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
              <Plus size={16} /> Cadastrar primeiro paciente
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patients.map(p => (
              <Link
                key={p.id}
                to={`/patients/${p.id}`}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(201,164,74,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#c9a44a', fontFamily: 'Orbitron', fontWeight: 700
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#a0a0a0' }}>
                    {age(p.birth_date)} · {p.phone || 'Sem telefone'}
                  </div>
                </div>
                <ChevronRight size={16} color="#a0a0a0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
