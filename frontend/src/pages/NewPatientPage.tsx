import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, MapPin, HeartPulse, Zap, Info, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

export default function NewPatientPage() {
  const token = useAuthStore(s => s.token);
  const navigate = useNavigate();
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

      const res = await axios.post('/api/patients', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate(`/patients/${res.data.id}`);
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
    <div className="animate-fade-in grid-pattern" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header with Glassmorphism */}
      <div className="page-header glass-surface" style={{ position: 'sticky', top: 0, zIndex: 100, marginBottom: 32 }}>
        <Link to="/patients" className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="animate-pulse-glow" style={{ background: 'rgba(201,164,74,0.1)', padding: 8, borderRadius: '50%' }}>
            <ClipboardList size={20} color="var(--luz-gold)" />
          </div>
          <div>
            <h1 className="font-display text-gold-gradient" style={{ fontSize: 18, margin: 0 }}>Cadastro E-Prontuário</h1>
            <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)', fontWeight: 500 }}>Siga rigorosamente os campos médicos</div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--luz-gray-dark)', fontSize: 14, maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Agora que fechamos, preciso de alguns dados teus para te cadastrar no e-prontuário:
          </p>
        </div>

        <form onSubmit={handleSubmit} className="stagger-sections">
          
          {/* ALERT BOX */}
          <div style={{ marginBottom: 32, padding: 24, background: 'rgba(13, 31, 51, 0.8)', border: '1px solid var(--luz-danger)', borderRadius: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Info size={28} color="var(--luz-danger)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--luz-white)', margin: 0, fontWeight: 700, lineHeight: 1.5, letterSpacing: '0.02em' }}>
              COPIE O FORMULÁRIO E RESPONDA. CASO NÃO SIGA ESSA ORIENTAÇÃO EXISTE GRANDE CHANCE DE PREENCHIMENTO ERRADO DOS DOCUMENTOS MÉDICOS E A TRASAR DISPENSAÇÃO DE MEDICAMENTOS / RECEITAS.
            </p>
          </div>

          {/* Section 1: Identificação */}
          <section className="card glass-card animate-fade-in-up" style={{ marginBottom: 24, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <UserCircle size={20} color="var(--luz-gold)" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luz-gold)' }}>1. Identificação Completa</h2>
            </div>
            
            <div className="new-patient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20 }}>
              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label-sm">Nome completo *</label>
                <input required type="text" className="form-input" placeholder="Ex: Nome do Paciente" value={form.name} onChange={e => updateField('name', e.target.value)} />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Data de nascimento *</label>
                <input required type="date" className="form-input" value={form.birth_date} onChange={e => updateField('birth_date', e.target.value)} />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Estado civil</label>
                <input type="text" className="form-input" value={form.civil_status} onChange={e => updateField('civil_status', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">CPF * (Para emissão da receita)</label>
                <input required type="text" className="form-input" placeholder="000.000.000-00" value={form.cpf} onChange={e => updateField('cpf', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="form-label-sm">Nome da mãe</label>
                <input type="text" className="form-input" placeholder="Essencial para o prontuário" value={form.mother_name} onChange={e => updateField('mother_name', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="form-label-sm">Profissão atual</label>
                <input type="text" className="form-input" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section 2: Endereço e Contato */}
          <section className="card glass-card animate-fade-in-up" style={{ animationDelay: '100ms', marginBottom: 24, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <MapPin size={20} color="var(--luz-gold)" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luz-gold)' }}>2. Localização e Contato</h2>
            </div>
            
            <div className="new-patient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label className="form-label-sm">Celular com DDD</label>
                <input type="tel" className="form-input" placeholder="(00) 00000-0000" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="form-label-sm">E-mail</label>
                <input type="email" className="form-input" placeholder="exemplo@luz.com" value={form.email} onChange={e => updateField('email', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 4' }}>
                <label className="form-label-sm">CEP com número da residência * (Essencial para emissão da receita)</label>
                <input required type="text" className="form-input" placeholder="00000-000, 123" value={form.cep_address} onChange={e => updateField('cep_address', e.target.value)} />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Cidade natal/atual</label>
                <input type="text" className="form-input" value={form.hometown_current} onChange={e => updateField('hometown_current', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label-sm">Plano de saúde</label>
                <input type="text" className="form-input" value={form.health_plan} onChange={e => updateField('health_plan', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section 3: Perfil Clínico */}
          <section className="card glass-card animate-fade-in-up" style={{ animationDelay: '200ms', marginBottom: 24, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <HeartPulse size={20} color="var(--luz-gold)" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luz-gold)' }}>3. Perfil Clínico e Estilo de Vida</h2>
            </div>
            
            <div className="new-patient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Peso/Altura</label>
                <input type="text" className="form-input" placeholder="Ex: 80kg / 1.80m" value={form.weight_height} onChange={e => updateField('weight_height', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Filhos? Quantos? Idades.</label>
                <input type="text" className="form-input" value={form.children_info} onChange={e => updateField('children_info', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Filhos? Pensa em ter?</label>
                <input type="text" className="form-input" value={form.future_children} onChange={e => updateField('future_children', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label-sm">Acompanhamento com outros profissionais da saúde?</label>
                <textarea className="form-input" rows={2} placeholder="Outros médicos, nutricionista, personal ou treino online? (Opcional, gera confiança médico paciente 😉)" value={form.other_professionals} onChange={e => updateField('other_professionals', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label-sm">Problemas de saúde prévios, medicamentos ou suplementos?</label>
                <textarea required className="form-input" rows={3} placeholder="Qualquer cápsula com vitamina ou qualquer coisa que seja ingerida fora comida, agua e bebidas" value={form.medical_history} onChange={e => updateField('medical_history', e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label-sm">Já utilizou hormonios (quaisquer: esteroides, da tireoide, do crescimento)?</label>
                <input type="text" className="form-input" placeholder="Facultativo, sinta-se a vontade para respondê-la na consulta" value={form.hormone_use} onChange={e => updateField('hormone_use', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section 4: Perguntas para Homens */}
          <section className="card glass-card animate-fade-in-up" style={{ animationDelay: '300ms', marginBottom: 24, padding: 32, borderLeft: '3px solid rgba(66, 133, 244, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Zap size={20} color="#4285f4" />
              <h2 className="font-display" style={{ fontSize: 14, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4285f4' }}>4. Perguntas para Homens (Importante)</h2>
              <span style={{ fontSize: 10, color: 'rgba(66, 133, 244, 0.6)', fontWeight: 700 }}>FACULTATIVAS 😉</span>
            </div>
            
            <div className="new-patient-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              <div>
                <label className="form-label-sm">Filhos: (número de filhos e se deseja ter nos proximos 6 meses)</label>
                <input type="text" className="form-input" value={form.children_details_6m} onChange={e => updateField('children_details_6m', e.target.value)} />
              </div>
              
              <div>
                <label className="form-label-sm">Disfunção de libido, ereção, apetite sexual ou ereção não plena?</label>
                <textarea className="form-input" rows={2} placeholder="Importante para melhor relação médico-paciente" value={form.libido_erection} onChange={e => updateField('libido_erection', e.target.value)} />
              </div>
            </div>
          </section>

          {/* LGPD and Actions */}
          <div className="card glass-card animate-fade-in-up" style={{ animationDelay: '400ms', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <input type="checkbox" checked={form.lgpd_consent} onChange={e => updateField('lgpd_consent', e.target.checked)} style={{ width: 24, height: 24, cursor: 'pointer', marginTop: 2, accentColor: 'var(--luz-gold)' }} />
              <div>
                <div style={{ fontSize: 14, color: 'var(--luz-white)', fontWeight: 700 }}>Consentimento LGPD</div>
                <div style={{ fontSize: 12, color: 'var(--luz-gray-dark)', marginTop: 4, lineHeight: 1.5 }}>Autorizo o armazenamento dos meus dados clínicos para fins de prontuário eletrônico de acordo com a legislação vigente.</div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ padding: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 16 }}>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ flex: 1, height: 56, fontSize: 14, letterSpacing: '0.05em' }}>
                {submitting ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO MÉDICO'}
              </button>
              <Link to="/patients" className="btn btn-secondary btn-lg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, fontSize: 14 }}>
                CANCELAR
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Floating Info */}
      <div className="animate-fade-in" style={{ position: 'fixed', bottom: 32, right: 32, maxWidth: 320, animationDelay: '600ms', zIndex: 100 }}>
        <div className="card glass-card" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(13, 31, 51, 0.95)', border: '1px solid var(--luz-gold)' }}>
          <Info size={24} color="var(--luz-gold)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--luz-white)', fontWeight: 500, margin: 0 }}>
            A precisão dos dados é essencial para a segurança de seus documentos médicos.
          </p>
        </div>
      </div>
    </div>
  );
}
