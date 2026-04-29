import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle } from 'lucide-react';

const FIELDS = [
  { key: 'name', label: 'Nome Completo', type: 'text', autoComplete: 'name' },
  { key: 'crm', label: 'CRM (ex: SC-33489)', type: 'text', autoComplete: 'off' },
  { key: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
  { key: 'password', label: 'Senha', type: 'password', autoComplete: 'new-password' },
] as const;

export default function SetupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', crm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || 'Erro ao criar conta.');
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-inner setup-page-inner">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Activity size={40} color="var(--luz-gold)" style={{ marginBottom: 16 }} aria-hidden />
          <h1 className="font-display" style={{ fontSize: 20, color: 'var(--luz-gold)' }}>PRIMEIRO ACESSO</h1>
          <p style={{ fontSize: 13, color: 'var(--luz-gray-dark)', marginTop: 8 }}>Configure sua conta de médico administrador.</p>
        </div>

        {done ? (
          <div className="alert alert-success" role="status" style={{ borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <CheckCircle size={32} color="var(--luz-success)" style={{ marginBottom: 12 }} aria-hidden />
            <p style={{ fontWeight: 600 }}>Conta criada com sucesso! Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card animate-fade-in-up" noValidate>
            {FIELDS.map(({ key, label, type, autoComplete }) => (
              <div key={key} style={{ marginBottom: 18 }}>
                <label htmlFor={`setup-${key}`} className="form-label">{label}</label>
                <input
                  id={`setup-${key}`}
                  type={type}
                  className="form-input"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  autoComplete={autoComplete}
                  required
                />
              </div>
            ))}
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
