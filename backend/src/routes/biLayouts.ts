import { Router, Response } from 'express';
import { pool, getSqliteDb, saveSqlite } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const biLayoutsRouter = Router();

const USE_PG = process.env.USE_PG === 'true';

// GET bi layout for a patient
biLayoutsRouter.get('/:id/layout', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  try {
    let layoutData: any = null;

    if (USE_PG) {
      const result = await pool.query(
        'SELECT layout_data FROM patient_bi_layouts WHERE patient_id = $1 ORDER BY id DESC LIMIT 1',
        [patientId]
      );
      if (result.rows.length > 0) layoutData = result.rows[0].layout_data;
    } else {
      const db = getSqliteDb();
      const row = db.prepare(
        'SELECT layout_data FROM patient_bi_layouts WHERE patient_id = ? ORDER BY id DESC LIMIT 1'
      ).get(patientId) as { layout_data: string } | undefined;
      if (row) layoutData = row.layout_data;
    }

    if (layoutData === null) {
      return res.json({ layout: null });
    }

    return res.json({
      layout: typeof layoutData === 'string' ? JSON.parse(layoutData) : layoutData,
    });
  } catch (error) {
    console.error('Fetch BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar layout do BI.' });
  }
});

// POST append/update bi layout for a patient
biLayoutsRouter.post('/:id/layout', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  const { layout } = req.body;
  const doctorId = req.doctorId ?? null;

  try {
    if (!layout) return res.status(400).json({ error: 'Layout nulo.' });

    const strLayout = JSON.stringify(layout);

    if (USE_PG) {
      await pool.query(
        'INSERT INTO patient_bi_layouts (patient_id, doctor_id, layout_data) VALUES ($1, $2, $3)',
        [patientId, doctorId, strLayout]
      );
    } else {
      const db = getSqliteDb();
      db.prepare(
        'INSERT INTO patient_bi_layouts (patient_id, doctor_id, layout_data) VALUES (?, ?, ?)'
      ).run(patientId, doctorId, strLayout);
      saveSqlite();
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Save BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao salvar layout do BI.' });
  }
});
