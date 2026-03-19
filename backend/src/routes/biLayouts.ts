import { Router } from 'express';
import { getDb } from '../db/database';

export const biLayoutsRouter = Router();

// GET bi layout for a patient
biLayoutsRouter.get('/:id/layout', async (req, res) => {
  const patientId = req.params.id;
  try {
    const result = await getDb().query(
      'SELECT layout_data FROM patient_bi_layouts WHERE patient_id = $1 ORDER BY id DESC LIMIT 1',
      [patientId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ layout: null });
    }
    
    // Postgres returns JSONB as an object already, no need for JSON.parse if stored as JSONB
    // but we'll check to be safe
    const layoutData = result.rows[0].layout_data;
    return res.json({ layout: typeof layoutData === 'string' ? JSON.parse(layoutData) : layoutData });
  } catch (error) {
    console.error('Fetch BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar layout do BI.' });
  }
});

// POST append/update bi layout for a patient
biLayoutsRouter.post('/:id/layout', async (req, res) => {
  const patientId = req.params.id;
  const { layout } = req.body;
  
  const doctorId = res.locals?.user?.id || 1; 

  try {
    if (!layout) return res.status(400).json({error: "Layout nulo."});
    
    const strLayout = JSON.stringify(layout);
    
    await getDb().query(
      'INSERT INTO patient_bi_layouts (patient_id, doctor_id, layout_data) VALUES ($1, $2, $3)',
      [patientId, doctorId, strLayout]
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Save BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao salvar layout do BI.' });
  }
});
