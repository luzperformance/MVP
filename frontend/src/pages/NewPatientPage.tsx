import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const GENDER_OPTIONS = [
  { value: '', label: 'Não informado' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
];

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          birth_date: form.birth_date,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          gender: form.gender || null,
          occupation: form.occupation.trim() || null,
          main_complaint: form.main_complaint.trim() || null,
          notes: form.notes.trim() || null,
          lgpd_consent_at: form.lgpd_consent ? new Date().toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar paciente.');
        setSubmitting(false);
        return;
      }
      navigate(`/patients/${data.id}`);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-patient-page">
      <div className="page-header">
        <Link to="/patients" className="btn btn-ghost btn-sm" aria-label="Voltar">
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <Users size={20} color="var(--luz-gold)" aria-hidden />
        <div>
          <div className="font-display new-patient-page-title">
            Novo Paciente
          </div>
          <div className="new-patient-page-subtitle">
            Cadastro manual — dados do paciente
          </div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="card animate-fade-in-up new-patient-form">
          <section className="new-patient-section">
            <h3 className="exam-section-title new-patient-section-title">Dados pessoais</h3>
            <div className="new-patient-grid">
              <div className="new-patient-field new-patient-field-full">
                <label className="form-label">Nome completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Maria Silva"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="new-patient-field">
                <label className="form-label">Data de nascimento *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.birth_date}
                  onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
                  required
                />
              </div>
              <div className="new-patient-field">
                <label className="form-label">Sexo</label>
                <select
                  className="form-input"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as '' | 'M' | 'F' | 'outro' }))}
                >
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="new-patient-field">
                <label className="form-label">Telefone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="new-patient-field">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="new-patient-field new-patient-field-full">
                <label className="form-label">Profissão / Ocupação</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Educador físico"
                  value={form.occupation}
                  onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="new-patient-section">
            <h3 className="exam-section-title new-patient-section-title">Queixa e anotações</h3>
            <div className="new-patient-queixa-grid">
              <div className="new-patient-field">
                <label className="form-label">Queixa principal</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Avaliação para treino de força"
                  value={form.main_complaint}
                  onChange={e => setForm(f => ({ ...f, main_complaint: e.target.value }))}
                />
              </div>
              <div className="new-patient-field">
                <label className="form-label">Anotações</label>
                <textarea
                  className="form-input"
                  placeholder="Observações gerais sobre o paciente..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{ minHeight: 80, resize: 'vertical' }}
                />
              </div>
            </div>
          </section>

          <div className="new-patient-lgpd">
            <label className="new-patient-lgpd-label">
              <input
                type="checkbox"
                checked={form.lgpd_consent}
                onChange={e => setForm(f => ({ ...f, lgpd_consent: e.target.checked }))}
                className="new-patient-lgpd-checkbox"
              />
              <span>Paciente consentiu com o uso dos dados conforme LGPD (termo de consentimento registrado no cadastro).</span>
            </label>
          </div>

          {error && (
            <p className="new-patient-error">{error}</p>
          )}

          <div className="new-patient-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Cadastrar paciente'}
            </button>
            <Link to="/patients" className="btn btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
