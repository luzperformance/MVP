import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Plus, Stethoscope, DollarSign, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const actions = [
  { to: '/patients',     icon: Users,       label: 'Pacientes',   desc: 'Ver todos os pacientes' },
  { to: '/patients/new', icon: Plus,        label: 'Novo Paciente', desc: 'Cadastrar paciente' },
  { to: '/consultas',    icon: Stethoscope, label: 'Consultas',   desc: 'Consultas do dia' },
  { to: '/agenda',       icon: Calendar,    label: 'Agenda',      desc: 'Próximos 14 dias' },
  { to: '/finance',      icon: DollarSign,  label: 'Financeiro',  desc: 'Receitas e despesas' },
];

export default function DashboardPage() {
  const doctor = useAuthStore(s => s.doctor);

  return (
    <div>
      <div className="page-header">
        <TrendingUp size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
            Dashboard
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>
            Bem-vindo, {doctor?.name ?? 'Doutor'}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {actions.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="card animate-fade-in-up"
              style={{ textDecoration: 'none', display: 'block', transition: 'border-color 0.2s ease' }}
              aria-label={label}
            >
              <Icon size={24} color="var(--luz-gold)" style={{ marginBottom: 12 }} aria-hidden />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--luz-white)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>{desc}</div>
            </Link>
          ))}
        </div>

        <div className="card card-gold animate-fade-in-up">
          <h3 className="exam-section-title" style={{ marginBottom: 12 }}>Como usar</h3>
          <ul style={{ color: 'var(--luz-gray)', fontSize: 13, lineHeight: 2, listStyle: 'none', padding: 0 }}>
            <li><strong style={{ color: 'var(--luz-white)' }}>Pacientes</strong> &mdash; Cadastrar e buscar pacientes</li>
            <li><strong style={{ color: 'var(--luz-white)' }}>Consultas</strong> &mdash; Veja os compromissos do dia via Google Calendar</li>
            <li><strong style={{ color: 'var(--luz-white)' }}>Exames</strong> &mdash; Upload de PDF e entrada de valores com dashboard</li>
            <li><strong style={{ color: 'var(--luz-white)' }}>Fotos</strong> &mdash; Registre a evolucao visual do paciente</li>
            <li><strong style={{ color: 'var(--luz-white)' }}>Financeiro</strong> &mdash; Importe CSV ou lance receitas/despesas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
