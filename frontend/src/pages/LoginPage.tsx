import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login.');
        return;
      }

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
        {/* Logo */}
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
            <Activity size={28} color="#c9a44a" />
          </div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 20,
            color: '#c9a44a',
            letterSpacing: '0.1em',
          }}>PRONTUÁRIO</h1>
          <p style={{ fontSize: 13, color: '#a0a0a0', marginTop: 4 }}>
            LuzPerformance — Acesso Restrito
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="card animate-fade-in-up">
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dr@luzperformance.com.br"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#ef4444',
              marginBottom: 20,
            }}>
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
