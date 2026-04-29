import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

export function useLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const fetchLeads = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { q, status, source, temperature } = filters;
      const url = `/api/leads?${q ? `q=${q}&` : ''}${status ? `status=${status}&` : ''}${source ? `source=${source}&` : ''}${temperature ? `temperature=${temperature}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setLeads(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar leads.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get('/api/leads/summary', { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar resumo de leads.');
    }
  }, [token]);

  const fetchLeadDetail = async (id: string) => {
    try {
      const res = await axios.get(`/api/leads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao carregar detalhe do lead.');
    }
  };

  const createLead = async (data: any) => {
    try {
      const res = await axios.post('/api/leads', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(prev => [res.data, ...prev]);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao criar lead.');
    }
  };

  const updateLead = async (id: string, data: any) => {
    try {
      const res = await axios.put(`/api/leads/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(prev => prev.map(l => l.id === id ? res.data : l));
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao atualizar lead.');
    }
  };

  const scoreLead = async (id: string, useAi = true) => {
    try {
      const res = await axios.post(`/api/leads/score/${id}`, { use_ai: useAi }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao pontuar lead.');
    }
  };

  const convertLead = async (id: string, birthDate: string) => {
    try {
      const res = await axios.post(`/api/leads/${id}/convert`, { birth_date: birthDate }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(prev => prev.map(l => l.id === id ? res.data.lead : l));
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao converter lead.');
    }
  };

  return { leads, summary, loading, error, fetchLeads, fetchSummary, fetchLeadDetail, createLead, updateLead, scoreLead, convertLead };
}
