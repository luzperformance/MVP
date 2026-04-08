import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Lead, LeadStatus, LeadTemperature } from '@shared/types';

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  contato: 'Contato',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

const TEMP_LABELS: Record<LeadTemperature, string> = {
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente',
};

const KANBAN_COLS: LeadStatus[] = ['novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido'];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function LeadsKanbanBoard({ leads }: { leads: Lead[] }) {
  const now = Date.now();
  const grouped = KANBAN_COLS.reduce(
    (acc, status) => {
      acc[status] = leads.filter(l => l.status === status);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  return (
    <div className="crm-kanban-container">
      {KANBAN_COLS.map(status => {
        const colLeads = grouped[status];
        const colValue = colLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0);

        return (
          <div key={status} className="crm-kanban-column">
            <div className="crm-kanban-header">
              <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
              <span style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginLeft: 6 }}>{colLeads.length}</span>
              {colValue > 0 ? (
                <span style={{ fontSize: 10, color: 'var(--luz-gold)', marginLeft: 'auto', fontWeight: 600 }}>
                  {BRL.format(colValue)}
                </span>
              ) : null}
            </div>
            <div className="crm-kanban-cards">
              {colLeads.map(lead => {
                const isOverdue = lead.next_followup_at ? new Date(lead.next_followup_at).getTime() < now : false;

                return (
                  <Link
                    key={lead.id}
                    to={`/crm/leads/${lead.id}`}
                    className="crm-kanban-card card"
                    aria-label={`Ver ${lead.name}`}
                    style={{ borderLeft: isOverdue ? '3px solid #f87171' : undefined }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, color: 'var(--luz-white)', fontSize: 13 }}>{lead.name}</div>
                      {lead.score != null && lead.score > 0 ? (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            borderRadius: 8,
                            padding: '1px 5px',
                            background: lead.score >= 75 ? '#4ade80' : lead.score >= 50 ? '#fbbf24' : '#94a3b8',
                            color: '#0a0a0f',
                          }}
                          title={`Score: ${lead.score}`}
                        >
                          {lead.score}
                        </span>
                      ) : null}
                    </div>
                    {lead.company ? <div style={{ fontSize: 11, color: 'var(--luz-gray-dark)' }}>{lead.company}</div> : null}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {lead.temperature ? (
                        <span className={`badge badge-${lead.temperature}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                          {TEMP_LABELS[lead.temperature]}
                        </span>
                      ) : null}
                      {lead.expected_value != null && lead.expected_value > 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--luz-gold)', fontWeight: 600 }}>
                          {BRL.format(lead.expected_value)}
                        </span>
                      ) : null}
                    </div>
                    {lead.next_followup_at ? (
                      <div
                        style={{
                          fontSize: 10,
                          color: isOverdue ? '#f87171' : 'var(--luz-gray-dark)',
                          marginTop: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {isOverdue ? <AlertCircle size={10} aria-hidden /> : <Calendar size={10} aria-hidden />}
                        {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
                        {isOverdue ? ' (atrasado)' : ''}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
              {colLeads.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--luz-gray-dark)' }}>Vazio</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
