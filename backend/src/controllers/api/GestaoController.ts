import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GestaoService } from '../../models/services/GestaoService';

export class GestaoController {
  constructor(private gestaoService: GestaoService) {}

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { q, status, state, package_type } = req.query;
      const rows = await this.gestaoService.getAll({
        q: q as string,
        status: status as string,
        state: state as string,
        package_type: package_type as string
      });
      return res.json(rows);
    } catch (error) {
      console.error('Error in GestaoController.getAll:', error);
      return res.status(500).json({ error: 'Erro ao carregar lista de gestão.' });
    }
  }

  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await this.gestaoService.getSummary();
      return res.json(summary);
    } catch (error) {
      console.error('Error in GestaoController.getSummary:', error);
      return res.status(500).json({ error: 'Erro ao carregar resumo de gestão.' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      const updated = await this.gestaoService.update(id, req.body);
      if (!updated) return res.status(404).json({ error: 'Paciente não encontrado.' });
      return res.json(updated);
    } catch (error) {
      console.error('Error in GestaoController.update:', error);
      return res.status(500).json({ error: 'Erro ao atualizar paciente.' });
    }
  }

  async import(req: AuthRequest, res: Response) {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para importar.' });
      }
      const result = await this.gestaoService.import(rows);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error in GestaoController.import:', error);
      return res.status(500).json({ error: 'Erro na importação.' });
    }
  }
}
