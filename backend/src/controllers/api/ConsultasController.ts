import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../../models/repositories/Database';

export class ConsultasController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const db = getDb();
      const { limit = '50', from, to } = req.query;
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
      
      let sql = `
        SELECT r.id, r.patient_id, r.type, r.source, r.consultation_date, r.duration_minutes,
               r.created_at, p.name AS patient_name
        FROM records r
        JOIN patients p ON p.id = r.patient_id AND p.deleted_at IS NULL
        WHERE 1=1
      `;
      const params: (string | number)[] = [];
      
      if (from && typeof from === 'string') {
        sql += ' AND r.consultation_date >= ?';
        params.push(from);
      }
      if (to && typeof to === 'string') {
        sql += ' AND r.consultation_date <= ?';
        params.push(to);
      }
      
      sql += ' ORDER BY r.consultation_date DESC, r.created_at DESC LIMIT ?';
      params.push(limitNum);
      
      const list = db.prepare(sql).all(...params);
      return res.json(list);
    } catch (error) {
      console.error('Error in ConsultasController.getAll:', error);
      return res.status(500).json({ error: 'Erro ao carregar consultas.' });
    }
  }
}
