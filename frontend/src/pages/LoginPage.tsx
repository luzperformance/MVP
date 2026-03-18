import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || (res.status === 401 ? 'E-mail ou senha incorretos.' : 'Erro ao fazer login.'));
        return;
      }

      const data = await res.json();
      setAuth(data.token, data.doctor);
      navigate('/dashboard');
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-inner">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60, height: 60,
            background: 'rgba(201,164,74,0.15)',
            borderRadius: '50%',
            border: '1px solid rgba(201,164,74,0.3)',
            marginBottom: 16,
          }}>
            <Activity size={28} color="var(--luz-gold)" aria-hidden />
          </div>
          <h1 className="font-display" style={{
            fontSize: 20,
            color: 'var(--luz-gold)',
            letterSpacing: '0.1em',
          }}>PRONTUÁRIO</h1>
          <p style={{ fontSize: 13, color: 'var(--luz-gray-dark)', marginTop: 4 }}>
            LuzPerformance &mdash; Acesso Restrito
          </p>
        </div>

        <form onSubmit={handleLogin} className="card animate-fade-in-up" noValidate>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-email" className="form-label">E-mail</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dr@luzperformance.com.br"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="login-password" className="form-label">Senha</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#ef4444',
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--luz-gray-dark)', textAlign: 'center', marginTop: 16 }}>
            Primeiro acesso?{' '}
            <a href="/setup" className="login-setup-link">
              Configurar conta
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
