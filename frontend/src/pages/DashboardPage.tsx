import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Plus, Stethoscope, DollarSign, Calendar, Target } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import AlertsWidget from '../components/AlertsWidget';

const actions = [
  { to: '/patients',     icon: Users,       label: 'Pacientes',   desc: 'Ver todos os pacientes' },
  { to: '/patients/new', icon: Plus,        label: 'Novo Paciente', desc: 'Cadastrar paciente' },
  { to: '/consultas',    icon: Stethoscope, label: 'Consultas',   desc: 'Agenda da semana' },
  { to: '/agenda',       icon: Calendar,    label: 'Mês',         desc: 'Visão mensal' },
  { to: '/finance',      icon: DollarSign,  label: 'Financeiro',  desc: 'Receitas e despesas' },
  { to: '/crm/leads',    icon: Target,      label: 'CRM',         desc: 'Leads e funil de vendas' },
];

export default function DashboardPage() {
  const doctor = useAuthStore(s => s.doctor);

  return (
    <div className="animate-fade-in">
      <div className="page-header glass-surface" style={{ borderBottom: '1px solid rgba(201, 164, 74, 0.2)' }}>
        <TrendingUp size={20} color="var(--luz-gold)" className="animate-pulse-glow" aria-hidden />
        <div>
          <div className="font-display text-gold-gradient" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>
            LuzPerformance Dashboard
          </div>
          <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)', fontWeight: 500 }}>
            Painel de Controle | Bem-vindo, {doctor?.name ?? 'Doutor'}
          </div>
        </div>
      </div>

      <div className="page-content grid-pattern">
        {/* Quick Access Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }} className="stagger">
          {actions.map(({ to, icon: Icon, label, desc }, idx) => (
            <Link
              key={to}
              to={to}
              className={`card glass-card animate-fade-in-up stagger-${idx + 1}`}
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}
              aria-label={label}
            >
              <div style={{ 
                background: 'rgba(201, 164, 74, 0.1)', 
                padding: 12, 
                borderRadius: '12px', 
                marginBottom: 16,
                border: '1px solid rgba(201, 164, 74, 0.2)'
              }}>
                <Icon size={24} color="var(--luz-gold)" aria-hidden />
              </div>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--luz-gold)', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)', lineHeight: 1.4 }}>{desc}</div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }} className="animate-fade-in-up">
          <AlertsWidget />
          
          <div className="card glass-card shadow-gold">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Target size={20} color="var(--luz-gold)" />
              <h3 className="font-display" style={{ fontSize: 14, color: 'var(--luz-white)', margin: 0 }}>Guia de Performance</h3>
            </div>
            
            <div style={{ position: 'relative' }}>
              <ul style={{ color: 'var(--luz-gray)', fontSize: 13, lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--luz-gold)' }} />
                  <span><strong style={{ color: 'var(--luz-white)' }}>Pacientes</strong> &mdash; Gestão centralizada e busca rápida</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--luz-gold)' }} />
                  <span><strong style={{ color: 'var(--luz-white)' }}>Consultas</strong> &mdash; Sincronização via Google Calendar</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--luz-gold)' }} />
                  <span><strong style={{ color: 'var(--luz-white)' }}>Bioconv</strong> &mdash; Análise de markers com IA integrada</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--luz-gold)' }} />
                  <span><strong style={{ color: 'var(--luz-white)' }}>Antes & Depois</strong> &mdash; Registro visual de evolução</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--luz-gold)' }} />
                  <span><strong style={{ color: 'var(--luz-white)' }}>Financeiro</strong> &mdash; BI de faturamento e despesas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
