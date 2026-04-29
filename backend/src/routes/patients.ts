import { Router } from 'express';
import { authMiddleware } from '../controllers/middleware/auth';
import { PatientsController } from '../controllers/api/PatientsController';
import { PatientService } from '../models/services/PatientService';
import { PatientRepository } from '../models/repositories/PatientRepository';

export const patientsRouter = Router();

const patientRepo = new PatientRepository();
const patientService = new PatientService(patientRepo);
const patientsController = new PatientsController(patientService);

patientsRouter.use(authMiddleware);

patientsRouter.get('/', patientsController.getAll);
patientsRouter.get('/:id', patientsController.getById);
patientsRouter.post('/', patientsController.create);
patientsRouter.put('/:id', patientsController.update);
patientsRouter.delete('/:id', patientsController.delete);
// Export logic could be moved to service/repository too if needed
