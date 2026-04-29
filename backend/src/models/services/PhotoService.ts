import { PhotoRepository } from '../repositories/PhotoRepository';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export class PhotoService {
  constructor(private photoRepo: PhotoRepository) {}

  async getPhotos(patientId: string, category?: string) {
    const photos = await this.photoRepo.findByPatientId(patientId, category);
    return (photos as any[]).map(p => ({
      ...p,
      url: `/uploads/photos/${p.filename}`
    }));
  }

  async createPhoto(patientId: string, data: any, file: any) {
    const id = uuidv4();
    const photo = await this.photoRepo.create({
      id,
      patient_id: patientId,
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      ...data
    });
    return { ...photo as any, url: `/uploads/photos/${file.filename}` };
  }

  async deletePhoto(id: string, patientId: string) {
    const photo = await this.photoRepo.findById(id, patientId) as any;
    if (!photo) return null;

    const filenameString = String(photo.filename ?? '').trim();
    if (!filenameString || filenameString.includes('..') || path.isAbsolute(filenameString) || filenameString.includes(path.sep)) {
      throw new Error('Arquivo não encontrado ou nome de arquivo inválido.');
    }

    const baseDir = path.resolve(process.env.UPLOAD_PATH || './uploads', 'photos');
    const filePath = path.resolve(baseDir, filenameString);
    const relativePath = path.relative(baseDir, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Caminho de arquivo inválido.');
    }

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err: any) {
      console.warn(`Could not delete file ${filePath}: ${err.message}`);
    }

    await this.photoRepo.delete(id);
    return true;
  }
}
