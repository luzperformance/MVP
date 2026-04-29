import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../../../shared/types';

export function usePatients() {
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Erro ao carregar pacientes.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    if (token) fetchPatients();
  }, [fetchPatients, token]);

  return { patients, loading, error, fetchPatients };
}
