import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LeadService } from '../../models/services/LeadService';

export class LeadsController {
  constructor(private leadService: LeadService) {}

  async getAll(req: AuthRequest, res: Response) {
    try {
      const leads = await this.leadService.getLeads(req.query);
      return res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await this.leadService.getSummary();
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching leads summary:', error);
      res.status(500).json({ error: 'Failed' });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const lead = await this.leadService.updateLead(req.params.id, {});
      if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
      const activities = await this.leadService.getActivities(req.params.id);
      return res.json({ ...lead, activities });
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(404).json({ error: 'Lead não encontrado.' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at } = req.body;
      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
      }
      const lead = await this.leadService.createLead(req.body);
      return res.status(201).json(lead);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const lead = await this.leadService.updateLead(req.params.id, req.body);
      return res.json(lead);
    } catch (error: any) {
      console.error('Error updating lead:', error);
      res.status(error.message === 'Lead não encontrado.' ? 404 : 500).json({ error: error.message });
    }
  }

  async score(req: AuthRequest, res: Response) {
    try {
      const result = await this.leadService.scoreLead(req.params.id, req.body.use_ai);
      return res.json(result);
    } catch (error: any) {
      console.error('Error scoring lead:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async convert(req: AuthRequest, res: Response) {
    try {
      const { birth_date } = req.body;
      if (!birth_date) return res.status(400).json({ error: 'Data de nascimento é obrigatória para criar paciente.' });
      const result = await this.leadService.convertLead(req.params.id, birth_date, req.ip || '');
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error converting lead:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createActivity(req: AuthRequest, res: Response) {
    try {
      const activity = await this.leadService.createActivity(req.params.id, req.body);
      return res.status(201).json(activity);
    } catch (error) {
      console.error('Error creating activity:', error);
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }
}
