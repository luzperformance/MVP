import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

export function useExams(patientId?: string) {
  const [exams, setExams] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const fetchExams = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/patients/${patientId}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar exames.');
    } finally {
      setLoading(false);
    }
  }, [patientId, token]);

  const fetchTimeline = useCallback(async (markers?: string[]) => {
    if (!patientId) return;
    try {
      const url = `/api/patients/${patientId}/exams/timeline${markers ? `?markers=${markers.join(',')}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setTimeline(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar linha do tempo.');
    }
  }, [patientId, token]);

  const createExam = async (data: FormData) => {
    if (!patientId) return;
    try {
      const res = await axios.post(`/api/patients/${patientId}/exams`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setExams(prev => [res.data, ...prev]);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao salvar exame.');
    }
  };

  const deleteExam = async (id: string) => {
    if (!patientId) return;
    try {
      await axios.delete(`/api/patients/${patientId}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao deletar exame.');
    }
  };

  return { exams, timeline, loading, error, fetchExams, fetchTimeline, createExam, deleteExam };
}
