import React from 'react';
import { CalendarDays, ExternalLink, Plus, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const GCAL_EMBED_URL =
  'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FSao_Paulo&showPrint=0&title=Consult%C3%B3rio&mode=WEEK&src=luzardi18%40gmail.com&color=%234285f4';

export default function ConsultasPage() {
  const doctor = useAuthStore(s => s.doctor);
  const canEdit = !!doctor?.can_edit_agenda;

  return (
    <div className="agenda-page">
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CalendarDays size={20} color="var(--luz-gold)" aria-hidden />
          <div>
            <div className="font-display" style={{ fontWeight: 700, color: 'var(--luz-white)', fontSize: 16, letterSpacing: '0.02em' }}>
              Semana
            </div>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)' }}>Consultório — Visão Semanal</div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 20 }}>
        <div style={{
          position: 'relative',
          padding: '2px', // Borda dourada gradiente sutil elegante
          background: 'linear-gradient(135deg, rgba(201,164,74,0.6) 0%, rgba(201,164,74,0.05) 50%, rgba(201,164,74,0.3) 100%)',
          borderRadius: 'calc(var(--border-radius) + 2px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,164,74,0.1) inset',
        }}>
          <div className="animate-fade-in-up agenda-gcal-wrap" style={{ 
            margin: 0, 
            border: 'none', 
            borderRadius: 'var(--border-radius)',
            background: 'var(--luz-navy)' 
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 22px',
              background: 'linear-gradient(to right, rgba(10,10,15,0.9), rgba(10,10,15,0.7))',
              borderBottom: '1px solid rgba(201,164,74,0.15)',
              borderTopLeftRadius: 'var(--border-radius)',
              borderTopRightRadius: 'var(--border-radius)',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #4285f4, #1a73e8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(66, 133, 244, 0.4)'
                }}>
                  <CalendarDays size={16} color="#fff" aria-hidden />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--luz-gold)', letterSpacing: '0.1em' }}>
                    CONSULTAS DA SEMANA
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--luz-gray-dark)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Sincronizado via Google Calendar
                  </span>
                </div>
              </div>
              
              {canEdit ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a
                    href="https://calendar.google.com/calendar/r/eventedit?text=Sessão%3A+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ 
                      fontSize: 12, padding: '8px 16px', minHeight: 'auto',
                      border: '1px solid var(--luz-gold)', color: 'var(--luz-gold)',
                      borderRadius: 6, transition: 'all 0.3s ease',
                      fontWeight: 600, boxShadow: '0 4px 15px rgba(201, 164, 74, 0.15)'
                    }}
                  >
                    <Plus size={14} aria-hidden style={{ marginRight: 6 }} />
                    Novo Evento
                  </a>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ 
                      fontSize: 12, padding: '8px 16px', minHeight: 'auto',
                      border: '1px solid rgba(201,164,74,0.2)',
                      borderRadius: 6, transition: 'all 0.3s ease'
                    }}
                  >
                    <Settings size={14} aria-hidden style={{ marginRight: 6 }} />
                    Gerenciar Calendário
                  </a>
                </div>
              ) : (
                <div style={{ 
                  fontSize: 11, color: 'var(--luz-gray-dark)', 
                  border: '1px dashed rgba(255,255,255,0.1)', 
                  padding: '6px 12px', borderRadius: 4, letterSpacing: '0.04em'
                }}>
                  Modo Visualização
                </div>
              )}
            </div>

            <div className="agenda-gcal-frame-wrap" style={{ position: 'relative' }}>
              <iframe
                src={GCAL_EMBED_URL}
                title="Consultas Semanais"
                className="agenda-gcal-frame"
                frameBorder="0"
                scrolling="no"
                aria-label="Calendário semanal do consultório"
                style={{ filter: 'contrast(1.02) brightness(0.98)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
