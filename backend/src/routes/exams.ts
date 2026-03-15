import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { getDb } from '../db/database';
import { computeMarkerStatus } from '../db/labMarkerStatus';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const examsRouter = Router();
examsRouter.use(authMiddleware);

// Multer for exam PDFs
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.env.UPLOAD_PATH || './uploads', 'exams'));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  cb(null, file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/'));
}});

// GET /api/patients/:patientId/exams
examsRouter.get('/:patientId/exams', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const exams = db.prepare(
    'SELECT * FROM lab_exams WHERE patient_id = ? ORDER BY exam_date DESC'
  ).all(req.params.patientId);

  // Include markers for each exam
  const result = exams.map((exam: any) => ({
    ...exam,
    markers: db.prepare('SELECT * FROM lab_markers WHERE exam_id = ? ORDER BY marker_category, marker_name').all(exam.id),
  }));

  return res.json(result);
});

// GET /api/patients/:patientId/exams/timeline
examsRouter.get('/:patientId/exams/timeline', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { markers } = req.query; // comma-separated marker names

  let markerFilter = '';
  let params: any[] = [req.params.patientId];

  if (markers) {
    const names = (markers as string).split(',').map(m => m.trim());
    markerFilter = `AND lm.marker_name IN (${names.map(() => '?').join(',')})`;
    params = [...params, ...names];
  }

  const data = db.prepare(`
    SELECT le.exam_date, lm.marker_name, lm.marker_category, lm.value, lm.unit,
           lm.ref_min, lm.ref_max, lm.optimal_min, lm.optimal_max, lm.status
    FROM lab_markers lm
    JOIN lab_exams le ON le.id = lm.exam_id
    WHERE le.patient_id = ? ${markerFilter}
    ORDER BY le.exam_date ASC, lm.marker_name
  `).all(...params);

  // Group by marker name for Recharts line chart format
  const grouped: Record<string, any> = {};
  const dates = new Set<string>();

  for (const row of data as any[]) {
    dates.add(row.exam_date);
    if (!grouped[row.marker_name]) {
      grouped[row.marker_name] = {
        name: row.marker_name,
        category: row.marker_category,
        unit: row.unit,
        ref_min: row.ref_min,
        ref_max: row.ref_max,
        optimal_min: row.optimal_min,
        optimal_max: row.optimal_max,
        data: [],
      };
    }
    grouped[row.marker_name].data.push({ date: row.exam_date, value: row.value, status: row.status });
  }

  // Available marker names for this patient (for filter UI)
  const availableMarkers = db.prepare(`
    SELECT DISTINCT lm.marker_name, lm.marker_category, lm.unit
    FROM lab_markers lm JOIN lab_exams le ON le.id = lm.exam_id
    WHERE le.patient_id = ? ORDER BY lm.marker_category, lm.marker_name
  `).all(req.params.patientId);

  return res.json({ timeline: Object.values(grouped), dates: [...dates].sort(), availableMarkers });
});

// POST /api/patients/:patientId/exams
examsRouter.post('/:patientId/exams', upload.single('pdf'), (req: AuthRequest, res: Response) => {
  const { exam_date, lab_name, notes, markers } = req.body;

  if (!exam_date) return res.status(400).json({ error: 'Data do exame é obrigatória.' });

  const id = uuidv4();
  const db = getDb();

  db.prepare(`
    INSERT INTO lab_exams (id, patient_id, exam_date, lab_name, pdf_filename, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.patientId, exam_date, lab_name || null,
         req.file?.filename || null, notes || null);

  // Insert markers if provided
  if (markers) {
    const parsedMarkers = typeof markers === 'string' ? JSON.parse(markers) : markers;
    const insertMarker = db.prepare(`
      INSERT INTO lab_markers (id, exam_id, marker_name, marker_category, value, unit, ref_min, ref_max, optimal_min, optimal_max, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((ms: any[]) => {
      for (const m of ms) {
        const status = computeMarkerStatus(
          m.value,
          m.ref_min ?? null,
          m.ref_max ?? null,
          m.optimal_min ?? null,
          m.optimal_max ?? null
        );
        insertMarker.run(
          uuidv4(),
          id,
          m.marker_name,
          m.marker_category || null,
          m.value,
          m.unit,
          m.ref_min ?? null,
          m.ref_max ?? null,
          m.optimal_min ?? null,
          m.optimal_max ?? null,
          status
        );
      }
    });
    insertMany(parsedMarkers);
  }

  const exam = db.prepare('SELECT * FROM lab_exams WHERE id = ?').get(id);
  const examMarkers = db.prepare('SELECT * FROM lab_markers WHERE exam_id = ?').all(id);
  return res.status(201).json({ ...exam as any, markers: examMarkers });
});

// DELETE /api/patients/:patientId/exams/:id
examsRouter.delete('/:patientId/exams/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM lab_exams WHERE id = ? AND patient_id = ?').run(req.params.id, req.params.patientId);
  return res.json({ message: 'Exame removido.' });
});
