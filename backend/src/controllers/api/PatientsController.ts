import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PatientService } from '../../models/services/PatientService';

export class PatientsController {
  constructor(private patientService: PatientService) {}

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { q } = req.query;
      const patients = await this.patientService.getAllPatients(q as string);
      return res.json(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const patient = await this.patientService.getPatientById(req.params.id);
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
      return res.json(patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Failed to fetch patient' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, birth_date } = req.body;
      if (!name || !birth_date) {
        return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
      }

      const patient = await this.patientService.createPatient(req.body, req.ip || '');
      return res.status(201).json(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const patient = await this.patientService.updatePatient(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
      return res.json(patient);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Failed to update patient' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await this.patientService.deletePatient(req.params.id);
      return res.json({ message: 'Paciente removido (LGPD: dados retidos por 5 anos, depois purgados).' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  }
}
