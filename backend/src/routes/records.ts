import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generatePreConsultSummary, type PreConsultData } from '../services/preConsultSummary';

export const recordsRouter = Router();
recordsRouter.use(authMiddleware);

// GET /api/patients/:patientId/pre-consult-summary — Resumo pré-consulta com IA
recordsRouter.get('/:patientId/pre-consult-summary', async (req: AuthRequest, res: Response) => {
  const { patientId } = req.params;
  const db = getDb();

  const patient = db.prepare(
    'SELECT id, name, birth_date, main_complaint, notes, observations, last_consultation, last_prescription, last_exam FROM patients WHERE id = ? AND deleted_at IS NULL'
  ).get(patientId) as Record<string, unknown> | undefined;

  if (!patient) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const records = db.prepare(
    'SELECT consultation_date, type, soap_subjective, soap_objective, soap_assessment, soap_plan FROM records WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT 5'
  ).all(patientId) as Array<Record<string, unknown>>;

  const exams = db.prepare(
    'SELECT id, exam_date, lab_name FROM lab_exams WHERE patient_id = ? ORDER BY exam_date DESC LIMIT 2'
  ).all(patientId) as Array<Record<string, unknown>>;

  const examsWithMarkers = exams.map((exam) => {
    const markers = db.prepare(
      'SELECT marker_name, value, unit, status, ref_min, ref_max FROM lab_markers WHERE exam_id = ? ORDER BY marker_category, marker_name'
    ).all(exam.id as string) as Array<Record<string, unknown>>;
    return { ...exam, markers };
  });

  const data: PreConsultData = {
    patient: {
      name: String(patient.name),
      birth_date: patient.birth_date as string | undefined,
      main_complaint: patient.main_complaint as string | undefined,
      notes: patient.notes as string | undefined,
      observations: patient.observations as string | undefined,
      last_consultation: patient.last_consultation as string | undefined,
      last_prescription: patient.last_prescription as string | undefined,
      last_exam: patient.last_exam as string | undefined,
    },
    recentRecords: records.map((r) => ({
      consultation_date: String(r.consultation_date),
      type: String(r.type),
      soap_subjective: r.soap_subjective as string | undefined,
      soap_objective: r.soap_objective as string | undefined,
      soap_assessment: r.soap_assessment as string | undefined,
      soap_plan: r.soap_plan as string | undefined,
    })),
    recentExams: examsWithMarkers.map((e) => ({
      exam_date: String(e.exam_date),
      lab_name: e.lab_name as string | undefined,
      markers: (e.markers as Array<Record<string, unknown>>).map((m) => ({
        marker_name: String(m.marker_name),
        value: Number(m.value),
        unit: String(m.unit),
        status: m.status as string | undefined,
        ref_min: m.ref_min as number | undefined,
        ref_max: m.ref_max as number | undefined,
      })),
    })),
  };

  try {
    const summary = await generatePreConsultSummary(data);
    return res.json({ summary });
  } catch (err) {
    console.error('Pre-consult summary error:', err);
    return res.status(500).json({ error: 'Erro ao gerar resumo pré-consulta. Tente novamente.' });
  }
});

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
