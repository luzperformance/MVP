import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import type { Record as PatientRecord } from '../../../../shared/types';

export function useRecords(patientId?: string) {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const fetchRecords = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/patients/${patientId}/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar prontuários.');
    } finally {
      setLoading(false);
    }
  }, [patientId, token]);

  const createRecord = async (data: any) => {
    if (!patientId) return;
    try {
      const res = await axios.post(`/api/patients/${patientId}/records`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(prev => [res.data, ...prev]);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao criar prontuário.');
    }
  };

  const getPreConsultSummary = async () => {
    if (!patientId) return;
    try {
      const res = await axios.get(`/api/patients/${patientId}/pre-consult-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.summary;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao gerar resumo IA.');
    }
  };

  return { records, loading, error, fetchRecords, createRecord, getPreConsultSummary };
}
