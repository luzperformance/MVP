import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'drluzardi93@gmail.com',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/');
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  }, [formData.email, formData.password, login, navigate]);

  return (
    <div className="login-page">
      <div className="login-page-inner">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Activity size={40} color="var(--luz-gold)" style={{ marginBottom: 16 }} aria-hidden />
          <h1 className="font-display" style={{ fontSize: 20, color: 'var(--luz-gold)' }}>PRONTUÁRIO</h1>
          <p style={{ fontSize: 13, color: 'var(--luz-gray-dark)', marginTop: 8 }}>LuzPerformance — Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="card animate-fade-in-up" noValidate>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="login-email" className="form-label">E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="dr@luzperformance.com.br"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="login-password" className="form-label">Senha</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/setup" className="login-setup-link">
            Primeiro acesso? Configurar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
