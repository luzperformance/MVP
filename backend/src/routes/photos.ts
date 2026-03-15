import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const photosRouter = Router();
photosRouter.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.env.UPLOAD_PATH || './uploads', 'photos'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/patients/:patientId/photos
photosRouter.get('/:patientId/photos', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { category } = req.query;
  const photos = category
    ? db.prepare('SELECT * FROM photos WHERE patient_id = ? AND category = ? ORDER BY taken_at DESC').all(req.params.patientId, category)
    : db.prepare('SELECT * FROM photos WHERE patient_id = ? ORDER BY taken_at DESC').all(req.params.patientId);
  return res.json(photos);
});

// POST /api/patients/:patientId/photos
photosRouter.post('/:patientId/photos', upload.single('photo'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo de foto não fornecido.' });

  const { record_id, category, description, taken_at } = req.body;
  const id = uuidv4();
  const db = getDb();

  db.prepare(`
    INSERT INTO photos (id, patient_id, record_id, filename, original_name, mime_type, size_bytes, category, description, taken_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.patientId, record_id || null, req.file.filename, req.file.originalname,
         req.file.mimetype, req.file.size, category || 'evolucao', description || null, taken_at || null);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as any;
  photo.url = `/uploads/photos/${photo.filename}`;
  return res.status(201).json(photo);
});

// DELETE /api/patients/:patientId/photos/:id
photosRouter.delete('/:patientId/photos/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const photo = db.prepare('SELECT filename FROM photos WHERE id = ? AND patient_id = ?').get(req.params.id, req.params.patientId) as any;
  if (!photo) return res.status(404).json({ error: 'Foto não encontrada.' });

  // Remove file from filesystem
  const filePath = path.resolve(process.env.UPLOAD_PATH || './uploads', 'photos', photo.filename);
  try { fs.unlinkSync(filePath); } catch { /* already removed */ }

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Foto removida.' });
});
