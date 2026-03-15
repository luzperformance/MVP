import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle } from 'lucide-react';

export default function SetupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', crm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--luz-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Activity size={40} color="#c9a44a" style={{ marginBottom: 16 }} />
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 20, color: '#c9a44a' }}>PRIMEIRO ACESSO</h1>
          <p style={{ fontSize: 13, color: '#a0a0a0', marginTop: 8 }}>Configure sua conta de médico administrator.</p>
        </div>

        {done ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 12 }} />
            <p style={{ color: '#22c55e', fontWeight: 600 }}>Conta criada! Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card animate-fade-in-up">
            {(['name', 'crm', 'email', 'password'] as const).map(field => (
              <div key={field} style={{ marginBottom: 18 }}>
                <label className="form-label">
                  {{ name: 'Nome Completo', crm: 'CRM (ex: SC-33489)', email: 'E-mail', password: 'Senha' }[field]}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  className="form-input"
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required
                />
              </div>
            ))}
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar conta</button>
          </form>
        )}
      </div>
    </div>
  );
}
