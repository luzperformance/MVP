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
      <div className="mesh-background" />
      
      <div className="login-page-inner">
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-in">
          <Activity size={60} color="var(--luz-gold)" className="floating-icon" style={{ marginBottom: 20 }} aria-hidden />
          <h1 className="font-display text-gold-gradient" style={{ fontSize: 28, letterSpacing: '0.2em' }}>
            PRONTUÁRIO
          </h1>
          <p style={{ fontSize: 13, color: 'var(--luz-gray-dark)', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            LuzPerformance — Gestão Inteligente
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass-login-card animate-fade-in-up" noValidate>
          <div className="premium-input-group">
            <label htmlFor="login-email">E-mail Corporativo</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="premium-input"
              placeholder="viana@luzperformance.com.br"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="premium-input-group">
            <label htmlFor="login-password">Senha de Acesso</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="premium-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error animate-fade-in" role="alert" style={{ marginBottom: 24, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <button type="submit" className="luz-gold-btn" disabled={loading}>
            {loading ? 'Validando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/setup" className="login-setup-link">
            Não possui conta? Solicitar acesso ao administrador
          </Link>
        </div>
      </div>
    </div>
  );
}

