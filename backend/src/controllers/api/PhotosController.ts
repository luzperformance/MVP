import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PhotoService } from '../../models/services/PhotoService';

export class PhotosController {
  constructor(private photoService: PhotoService) {}

  async getPhotos(req: AuthRequest, res: Response) {
    try {
      const { category } = req.query;
      const photos = await this.photoService.getPhotos(
        req.params.patientId,
        category as string
      );
      return res.json(photos);
    } catch (error) {
      console.error('Error in PhotosController.getPhotos:', error);
      return res.status(500).json({ error: 'Erro ao carregar fotos.' });
    }
  }

  async createPhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Arquivo de foto não fornecido.' });
      
      const photo = await this.photoService.createPhoto(
        req.params.patientId,
        req.body,
        req.file
      );
      return res.status(201).json(photo);
    } catch (error) {
      console.error('Error in PhotosController.createPhoto:', error);
      return res.status(500).json({ error: 'Erro ao salvar foto.' });
    }
  }

  async deletePhoto(req: AuthRequest, res: Response) {
    try {
      const result = await this.photoService.deletePhoto(
        req.params.id,
        req.params.patientId
      );
      if (!result) return res.status(404).json({ error: 'Foto não encontrada.' });
      return res.json({ message: 'Foto removida.' });
    } catch (error: any) {
      console.error('Error in PhotosController.deletePhoto:', error);
      return res.status(500).json({ error: error.message || 'Erro ao remover foto.' });
    }
  }
}
