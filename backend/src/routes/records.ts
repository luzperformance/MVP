import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const recordsRouter = Router();
recordsRouter.use(authMiddleware);

// GET /api/patients/:patientId/records
recordsRouter.get('/:patientId/records', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const records = db.prepare(
    'SELECT * FROM records WHERE patient_id = ? ORDER BY consultation_date DESC'
  ).all(req.params.patientId);
  return res.json(records);
});

// GET /api/patients/:patientId/records/:id
recordsRouter.get('/:patientId/records/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM records WHERE id = ? AND patient_id = ?'
  ).get(req.params.id, req.params.patientId);
  if (!record) return res.status(404).json({ error: 'Prontuário não encontrado.' });
  return res.json(record);
});

// POST /api/patients/:patientId/records
recordsRouter.post('/:patientId/records', (req: AuthRequest, res: Response) => {
  const { type, source, raw_input, soap_subjective, soap_objective,
          soap_assessment, soap_plan, notes, consultation_date, duration_minutes } = req.body;

  if (!type || !source || !consultation_date) {
    return res.status(400).json({ error: 'Tipo, fonte e data da consulta são obrigatórios.' });
  }

  const id = uuidv4();
  const db = getDb();
  db.prepare(`
    INSERT INTO records (id, patient_id, type, source, raw_input, soap_subjective,
      soap_objective, soap_assessment, soap_plan, notes, consultation_date, duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.patientId, type, source, raw_input || null, soap_subjective || null,
         soap_objective || null, soap_assessment || null, soap_plan || null,
         notes || null, consultation_date, duration_minutes || null);

  return res.status(201).json(db.prepare('SELECT * FROM records WHERE id = ?').get(id));
});

// PUT /api/patients/:patientId/records/:id
recordsRouter.put('/:patientId/records/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM records WHERE id = ? AND patient_id = ?').get(req.params.id, req.params.patientId);
  if (!existing) return res.status(404).json({ error: 'Prontuário não encontrado.' });

  const { soap_subjective, soap_objective, soap_assessment, soap_plan, notes, duration_minutes } = req.body;
  db.prepare(`
    UPDATE records SET soap_subjective = COALESCE(?, soap_subjective),
      soap_objective = COALESCE(?, soap_objective),
      soap_assessment = COALESCE(?, soap_assessment),
      soap_plan = COALESCE(?, soap_plan),
      notes = COALESCE(?, notes),
      duration_minutes = COALESCE(?, duration_minutes)
    WHERE id = ?
  `).run(soap_subjective, soap_objective, soap_assessment, soap_plan, notes, duration_minutes, req.params.id);

  return res.json(db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id));
});
