import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FinanceService } from '../../models/services/FinanceService';

export class FinanceController {
  constructor(private financeService: FinanceService) {}

  async getSummary(req: AuthRequest, res: Response) {
    try {
      const { period, from, to } = req.query;
      const result = await this.financeService.getSummary(
        period as string,
        from as string,
        to as string
      );
      return res.json(result);
    } catch (error) {
      console.error('Finance summary error:', error);
      res.status(500).json({ error: 'Erro ao carregar resumo financeiro.' });
    }
  }

  async getEntries(req: AuthRequest, res: Response) {
    try {
      const { type, from, to } = req.query;
      const entries = await this.financeService.getEntries({
        type: type as string,
        from: from as string,
        to: to as string
      });
      return res.json(entries);
    } catch (error) {
      console.error('Error listing entries:', error);
      res.status(500).json({ error: 'Erro ao listar lançamentos.' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { type, category, amount, entry_date } = req.body;
      if (!type || !category || amount == null || !entry_date) {
        return res.status(400).json({ error: 'Campos obrigatórios: type, category, amount, entry_date.' });
      }
      const row = await this.financeService.createEntry(req.body);
      return res.status(201).json(row);
    } catch (error) {
      console.error('Error creating entry:', error);
      res.status(500).json({ error: 'Erro ao criar lançamento.' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const changes = await this.financeService.deleteEntry(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Lançamento não encontrado.' });
      return res.json({ message: 'Lançamento removido.' });
    } catch (error) {
      console.error('Error deleting entry:', error);
      res.status(500).json({ error: 'Erro ao remover lançamento.' });
    }
  }

  async import(req: AuthRequest, res: Response) {
    try {
      const file = req.file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ error: 'Arquivo CSV vázio ou ausente.' });
      }
      const result = await this.financeService.importCsv(file.buffer);
      return res.json(result);
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ error: error.message || 'Erro na importação.' });
    }
  }
}
