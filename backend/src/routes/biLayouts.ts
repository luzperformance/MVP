import { Router } from 'express';
import { getDb } from '../db/database';

export const biLayoutsRouter = Router();

// GET bi layout for a patient
biLayoutsRouter.get('/:id/layout', async (req, res) => {
  const patientId = req.params.id;
  try {
    const row = getDb().prepare(`SELECT layout_data FROM patient_bi_layouts WHERE patient_id = ? ORDER BY id DESC LIMIT 1`).get(patientId);
    if (!row) {
      return res.json({ layout: null });
    }
    return res.json({ layout: JSON.parse((row as any).layout_data) });
  } catch (error) {
    console.error('Fetch BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar layout do BI.' });
  }
});

// POST append/update bi layout for a patient
biLayoutsRouter.post('/:id/layout', async (req, res) => {
  const patientId = req.params.id;
  const { layout } = req.body;
  
  // Assumindo doctor_id vindo de "res.locals.user" - mockup 1
  const doctorId = res.locals?.user?.id || 1; 

  try {
    if (!layout) return res.status(400).json({error: "Layout nulo."});
    
    const strLayout = JSON.stringify(layout);
    
    // Inserimos um novo registro criando um histórico de alterações
    getDb().prepare(`
      INSERT INTO patient_bi_layouts (patient_id, doctor_id, layout_data)
      VALUES (?, ?, ?)
    `).run(patientId, doctorId, strLayout);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Save BI Layout Error:', error);
    return res.status(500).json({ error: 'Erro ao salvar layout do BI.' });
  }
});
