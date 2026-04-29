import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../controllers/middleware/auth';
import { PhotosController } from '../controllers/api/PhotosController';
import { PhotoService } from '../models/services/PhotoService';
import { PhotoRepository } from '../models/repositories/PhotoRepository';

export const photosRouter = Router();

const photoRepo = new PhotoRepository();
const photoService = new PhotoService(photoRepo);
const photosController = new PhotosController(photoService);

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

photosRouter.use(authMiddleware);

// GET /api/patients/:patientId/photos
photosRouter.get('/:patientId/photos', (req: any, res) => photosController.getPhotos(req, res));

// POST /api/patients/:patientId/photos
photosRouter.post('/:patientId/photos', upload.single('photo'), (req: any, res) => photosController.createPhoto(req, res));

// DELETE /api/patients/:patientId/photos/:id
photosRouter.delete('/:patientId/photos/:id', (req: any, res) => photosController.deletePhoto(req, res));
