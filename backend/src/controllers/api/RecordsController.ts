import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RecordService } from '../../models/services/RecordService';

export class RecordsController {
  constructor(private recordService: RecordService) {}

  async getPreConsultSummary(req: AuthRequest, res: Response) {
    try {
      const { patientId } = req.params;
      const summary = await this.recordService.getPreConsultSummary(patientId);
      return res.json({ summary });
    } catch (error: any) {
      console.error('Pre-consult summary error:', error);
      res.status(error.message === 'Paciente não encontrado.' ? 404 : 500)
         .json({ error: error.message || 'Erro ao gerar resumo pré-consulta.' });
    }
  }

  async getAllByPatient(req: AuthRequest, res: Response) {
    try {
      const { patientId } = req.params;
      const records = await this.recordService.getPatientRecords(patientId);
      return res.json(records);
    } catch (error) {
      console.error('Error fetching records:', error);
      res.status(500).json({ error: 'Failed to fetch records' });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const record = await this.recordService.getRecordById(req.params.id, req.params.patientId);
      if (!record) return res.status(404).json({ error: 'Prontuário não encontrado.' });
      return res.json(record);
    } catch (error) {
      console.error('Error fetching record:', error);
      res.status(500).json({ error: 'Failed to fetch record' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { type, source, consultation_date } = req.body;
      if (!type || !source || !consultation_date) {
        return res.status(400).json({ error: 'Tipo, fonte e data da consulta são obrigatórios.' });
      }

      const record = await this.recordService.createRecord(req.params.patientId, req.body);
      return res.status(201).json(record);
    } catch (error) {
      console.error('Error creating record:', error);
      res.status(500).json({ error: 'Failed to create record' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const record = await this.recordService.updateRecord(req.params.id, req.params.patientId, req.body);
      if (!record) return res.status(404).json({ error: 'Prontuário não encontrado.' });
      return res.json(record);
    } catch (error) {
      console.error('Error updating record:', error);
      res.status(500).json({ error: 'Failed to update record' });
    }
  }
}
