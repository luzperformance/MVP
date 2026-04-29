import React, { useState } from 'react';
import { X, UserCircle, MapPin, HeartPulse, Zap, Info, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../stores/authStore';
import PatientFormPastePanel from './PatientFormPastePanel';
import { applyPatientFormPastePatch } from '../../../utils/patientFormPaste';

interface NewPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewPatientModal({ onClose, onSuccess }: NewPatientModalProps) {
  const token = useAuthStore(s => s.token);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    phone: '',
    email: '',
    gender: '' as '' | 'M' | 'F' | 'outro',
    occupation: '',
    main_complaint: '',
    notes: '',
    lgpd_consent: true,
    mother_name: '',
    children_info: '',
    weight_height: '',
    future_children: '',
    cpf: '',
    cep_address: '',
    civil_status: '',
    health_plan: '',
    other_professionals: '',
    hometown_current: '',
    medical_history: '',
    hormone_use: '',
    libido_erection: '',
    children_details_6m: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      const payload = {
        name: form.name.trim(),
        birth_date: form.birth_date,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        gender: form.gender || null,
        occupation: form.occupation.trim() || null,
        main_complaint: form.main_complaint.trim() || null,
        notes: form.notes.trim() || null,
        lgpd_consent_at: form.lgpd_consent ? new Date().toISOString() : null,
        mgmt_data: {
          mother_name: form.mother_name.trim(),
          children_info: form.children_info.trim(),
          weight_height: form.weight_height.trim(),
          future_children: form.future_children.trim(),
          cpf: form.cpf.trim(),
          cep_address: form.cep_address.trim(),
          civil_status: form.civil_status.trim(),
          health_plan: form.health_plan.trim(),
          other_professionals: form.other_professionals.trim(),
          hometown_current: form.hometown_current.trim(),
          profession: form.occupation.trim(),
          medical_history: form.medical_history.trim(),
          hormone_use: form.hormone_use.trim(),
          male_specific: {
            libido_erection: form.libido_erection.trim(),
            children_details: form.children_details_6m.trim(),
          }
        }
      };

      await axios.post('/api/patients', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao cadastrar paciente.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-container glass-card animate-fade-in-up" 
        onClick={e => e.stopPropagation()}
        style={{ width: '95%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto', position: 'relative', border: '1px solid var(--luz-gold)' }}
      >
        <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Fechar" style={{ top: 20, right: 20 }}>
          <X size={24} />
        </button>

        <div style={{ padding: '40px 32px' }}>
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div className="animate-pulse-glow" style={{ background: 'rgba(201,164,74,0.1)', padding: 12, borderRadius: '50%', width: 'fit-content', margin: '0 auto 16px' }}>
              <ClipboardList size={32} color="var(--luz-gold)" />
            </div>
            <h2 className="font-display text-gold-gradient" style={{ fontSize: 26, margin: 0, letterSpacing: '0.05em' }}>E-PRONTUÁRIO</h2>
            <p style={{ color: 'var(--luz-white)', fontSize: 14, marginTop: 12, opacity: 0.9 }}>
              Agora que fechamos, preciso de alguns dados teus para te cadastrar no e-prontuário:
            </p>
          </div>

          <PatientFormPastePanel
            mergeFromPaste={patch => setForm(prev => applyPatientFormPastePatch(prev, patch))}
          />

          <form onSubmit={handleSubmit} className="stagger-sections">
            
            {/* ALERT BOX */}
            <div style={{ marginBottom: 32, padding: 20, background: 'rgba(13, 31, 51, 0.8)', border: '1px solid var(--luz-danger)', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
              <Info size={24} color="var(--luz-danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--luz-white)', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                COPIE O FORMULÁRIO E RESPONDA. CASO NÃO SIGA ESSA ORIENTAÇÃO EXISTE GRANDE CHANCE DE PREENCHIMENTO ERRADO DOS DOCUMENTOS MÉDICOS E A TRASAR DISPENSAÇÃO DE MEDICAMENTOS / RECEITAS.
              </p>
            </div>

            {/* SECTION 1: IDENTIFICAÇÃO */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <UserCircle size={20} color="var(--luz-gold)" />
                <h3 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--luz-gold)' }}>1. Identificação Completa</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label-sm">Nome completo *</label>
                  <input required className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Como no documento" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Data de nascimento *</label>
                  <input required type="date" className="form-input" value={form.birth_date} onChange={e => updateField('birth_date', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Estado civil</label>
                  <input className="form-input" value={form.civil_status} onChange={e => updateField('civil_status', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">CPF * (Para Receituário)</label>
                  <input required className="form-input" placeholder="000.000.000-00" value={form.cpf} onChange={e => updateField('cpf', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label className="form-label-sm">Nome da mãe</label>
                  <input className="form-input" value={form.mother_name} onChange={e => updateField('mother_name', e.target.value)} placeholder="Crucial para prontuário" />
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label className="form-label-sm">Profissão atual</label>
                  <input className="form-input" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} />
                </div>
              </div>
            </div>

            {/* SECTION 2: LOCALIZAÇÃO E CONTATO */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <MapPin size={20} color="var(--luz-gold)" />
                <h3 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--luz-gold)' }}>2. Endereço e Contato</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: 'span 3' }}>
                  <label className="form-label-sm">Celular com DDD</label>
                  <input className="form-input" placeholder="(00) 00000-0000" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label className="form-label-sm">E-mail</label>
                  <input type="email" className="form-input" placeholder="seu@email.com" value={form.email} onChange={e => updateField('email', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="form-label-sm">CEP com número da residência * (Essencial para Receita)</label>
                  <input required className="form-input" placeholder="00000-000, 123" value={form.cep_address} onChange={e => updateField('cep_address', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Cidade natal/atual</label>
                  <input className="form-input" value={form.hometown_current} onChange={e => updateField('hometown_current', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label-sm">Plano de saúde</label>
                  <input className="form-input" value={form.health_plan} onChange={e => updateField('health_plan', e.target.value)} />
                </div>
              </div>
            </div>

            {/* SECTION 3: PERFIL CLÍNICO */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <HeartPulse size={20} color="var(--luz-gold)" />
                <h3 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--luz-gold)' }}>3. Perfil Clínico e Estilo de Vida</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Peso/Altura</label>
                  <input className="form-input" placeholder="Ex: 80kg / 1.75m" value={form.weight_height} onChange={e => updateField('weight_height', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Filhos? Quantos? Idades.</label>
                  <input className="form-input" value={form.children_info} onChange={e => updateField('children_info', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label-sm">Filhos? Pensa em ter?</label>
                  <input className="form-input" value={form.future_children} onChange={e => updateField('future_children', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label-sm">Acompanhamento com outros profissionais da saúde?</label>
                  <textarea className="form-input" rows={2} placeholder="Outros médicos, nutricionista, personal ou treino online? (Opcional, gera confiança médico paciente 😉)" value={form.other_professionals} onChange={e => updateField('other_professionals', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label-sm">Problemas de saúde prévios, medicamentos ou suplementos?</label>
                  <textarea required className="form-input" rows={3} placeholder="Qualquer cápsula com vitamina ou qualquer coisa ingerida fora comida, agua e bebidas..." value={form.medical_history} onChange={e => updateField('medical_history', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label-sm">Já utilizou hormônios (esteroides, tireoide, GH)?</label>
                  <input className="form-input" placeholder="Facultativa, sinta-se a vontade para responder na consulta" value={form.hormone_use} onChange={e => updateField('hormone_use', e.target.value)} />
                </div>
              </div>
            </div>

            {/* SECTION 4: SAÚDE MASCULINA */}
            <div style={{ marginBottom: 32, padding: 24, background: 'rgba(59, 130, 246, 0.03)', borderRadius: 16, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Zap size={20} color="#4285f4" />
                <h3 className="font-display" style={{ fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4285f4' }}>4. Perguntas para Homens (Importante)</h3>
                <span style={{ fontSize: 10, color: 'rgba(59, 130, 246, 0.6)', fontWeight: 600 }}>FACULTATIVAS 😉</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }}>
                <div>
                  <label className="form-label-sm">Filhos: (Número de filhos e se deseja ter nos próximos 6 meses)</label>
                  <input className="form-input" value={form.children_details_6m} onChange={e => updateField('children_details_6m', e.target.value)} />
                </div>
                <div>
                  <label className="form-label-sm">Disfunção de libido, ereção, apetite sexual ou ereção não plena?</label>
                  <textarea className="form-input" rows={2} placeholder="Sua resposta ajuda na melhor relação médico-paciente" value={form.libido_erection} onChange={e => updateField('libido_erection', e.target.value)} />
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 16 }}>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, height: 52, fontSize: 14, letterSpacing: '0.05em' }}>
                {submitting ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO MÉDICO'}
              </button>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, height: 52, fontSize: 14 }}>
                CANCELAR
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(201,164,74,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Info size={20} color="var(--luz-gold)" />
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--luz-gray-dark)', margin: 0 }}>
                <strong style={{ color: 'var(--luz-white)', display: 'block', marginBottom: 4 }}>NOTA IMPORTANTE:</strong>
                A precisão das informações acima é crucial para a segurança do seu tratamento e para a emissão correta de documentos legais (receitas e atestados).
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
