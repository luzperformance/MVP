import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

export function useFinance() {
  const [summary, setSummary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const fetchSummary = useCallback(async (period = '6', from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/finance/summary?period=${period}${from && to ? `&from=${from}&to=${to}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar resumo financeiro.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchEntries = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { type, from, to } = filters;
      const url = `/api/finance/entries?${type ? `type=${type}&` : ''}${from ? `from=${from}&` : ''}${to ? `to=${to}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setEntries(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createEntry = async (data: any) => {
    try {
      const res = await axios.post('/api/finance/entries', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(prev => [res.data, ...prev]);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao salvar lançamento.');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await axios.delete(`/api/finance/entries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao remover lançamento.');
    }
  };

  const importCsv = async (formData: FormData) => {
    try {
      const res = await axios.post('/api/finance/import', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro na importação.');
    }
  };

  return { summary, entries, loading, error, fetchSummary, fetchEntries, createEntry, deleteEntry, importCsv };
}
