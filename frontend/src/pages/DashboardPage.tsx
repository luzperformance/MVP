import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, FlaskConical, TrendingUp, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const { doctor } = useAuthStore();

  const actions = [
    { to: '/patients', icon: Users, label: 'Pacientes', color: '#c9a44a', desc: 'Ver todos os pacientes' },
    { to: '/patients/new', icon: Plus, label: 'Novo Paciente', color: '#22c55e', desc: 'Cadastrar paciente' },
  ];

  return (
    <div>
      <div className="page-header">
        <TrendingUp size={20} color="#c9a44a" />
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Dashboard</div>
          <div style={{ fontSize: 12, color: '#a0a0a0' }}>Bem-vindo, {doctor?.name}</div>
        </div>
      </div>

      <div className="page-content">
        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {actions.map(({ to, icon: Icon, label, color, desc }) => (
            <Link key={to} to={to} className="card" style={{ textDecoration: 'none', display: 'block' }}>
              <Icon size={24} color={color} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#a0a0a0' }}>{desc}</div>
            </Link>
          ))}
        </div>

        {/* Info card */}
        <div className="card card-gold animate-fade-in-up">
          <h3 style={{ color: '#c9a44a', marginBottom: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Como usar
          </h3>
          <ul style={{ color: '#a0a0a0', fontSize: 13, lineHeight: 2, listStyle: 'none', padding: 0 }}>
            <li>📋 <strong style={{color:'#e0e0e0'}}>Pacientes</strong> → Cadastrar e buscar pacientes</li>
            <li>📝 <strong style={{color:'#e0e0e0'}}>Nova Consulta</strong> → Cole a transcrição do Google Meet ou preencha manualmente</li>
            <li>🧪 <strong style={{color:'#e0e0e0'}}>Exames</strong> → Upload de PDF e entrada de valores com dashboard gráfico</li>
            <li>📸 <strong style={{color:'#e0e0e0'}}>Fotos</strong> → Registre a evolução visual do paciente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
