import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const patientsRouter = Router();
patientsRouter.use(authMiddleware);

// GET /api/patients
patientsRouter.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { q } = req.query;
  const patients = q
    ? db.prepare(`SELECT id, name, birth_date, phone, email, gender, created_at
                  FROM patients WHERE deleted_at IS NULL AND name LIKE ?
                  ORDER BY name LIMIT 100`).all(`%${q}%`)
    : db.prepare(`SELECT id, name, birth_date, phone, email, gender, created_at
                  FROM patients WHERE deleted_at IS NULL ORDER BY name LIMIT 100`).all();
  return res.json(patients);
});

// GET /api/patients/:id
patientsRouter.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const patient = db.prepare(
    'SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL'
  ).get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
  return res.json(patient);
});

// POST /api/patients
patientsRouter.post('/', (req: AuthRequest, res: Response) => {
  const { name, birth_date, cpf_encrypted, phone, email, gender, occupation,
          main_complaint, notes, lgpd_consent_at, mgmt_data } = req.body;

  if (!name || !birth_date) {
    return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
  }

  const id = uuidv4();
  const db = getDb();
  
  // Merge default mgmt_data with provided data
  const finalMgmtData = {
    status: 'ativo',
    origin: null,
    first_consultation: null,
    last_consultation: null,
    uses_ea: false,
    wants_children: false,
    ...(mgmt_data || {})
  };

  db.prepare(`
    INSERT INTO patients (id, name, birth_date, cpf_encrypted, phone, email,
      gender, occupation, main_complaint, notes, lgpd_consent_at, lgpd_consent_ip, mgmt_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, birth_date, cpf_encrypted || null, phone || null, email || null,
         gender || null, occupation || null, main_complaint || null, notes || null,
         lgpd_consent_at || null, req.ip, JSON.stringify(finalMgmtData));

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  return res.status(201).json(patient);
});

// PUT /api/patients/:id
patientsRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Paciente não encontrado.' });

  const { name, birth_date, phone, email, gender, occupation, main_complaint, notes } = req.body;
  db.prepare(`
    UPDATE patients SET name = COALESCE(?, name), birth_date = COALESCE(?, birth_date),
      phone = COALESCE(?, phone), email = COALESCE(?, email), gender = COALESCE(?, gender),
      occupation = COALESCE(?, occupation), main_complaint = COALESCE(?, main_complaint),
      notes = COALESCE(?, notes) WHERE id = ?
  `).run(name, birth_date, phone, email, gender, occupation, main_complaint, notes, req.params.id);

  return res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id));
});

// DELETE /api/patients/:id — Soft delete (LGPD)
patientsRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Paciente removido (LGPD: dados retidos por 5 anos, depois purgados).' });
});

// GET /api/patients/:id/export — Exportação LGPD
patientsRouter.get('/:id/export', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });

  const records = db.prepare('SELECT * FROM records WHERE patient_id = ?').all(req.params.id);
  const photos = db.prepare('SELECT id, category, description, taken_at, created_at FROM photos WHERE patient_id = ?').all(req.params.id);
  const exams = db.prepare('SELECT * FROM lab_exams WHERE patient_id = ?').all(req.params.id);

  const auditLog = db.prepare('INSERT INTO audit_log (action, entity, entity_id, patient_id, ip, details) VALUES (?, ?, ?, ?, ?, ?)');
  auditLog.run('EXPORT', 'patient', req.params.id, req.params.id, req.ip, 'LGPD data export');

  res.setHeader('Content-Disposition', `attachment; filename=dados_paciente_${req.params.id}.json`);
  return res.json({ patient, records, photos, exams, exported_at: new Date().toISOString() });
});
