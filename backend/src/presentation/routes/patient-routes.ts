import { Router } from 'express';
import { PatientController } from '../controllers/patient-controller';
import { ListPatientsUseCase } from '../../application/use_cases/list-patients';
import { SQLitePatientRepository } from '../../infrastructure/database/repositories/sqlite-patient-repository';

const patientRouter = Router();

// Manual Dependency Injection
const patientRepository = new SQLitePatientRepository();
const listPatientsUseCase = new ListPatientsUseCase(patientRepository);
const patientController = new PatientController(listPatientsUseCase);

patientRouter.get('/', (req, res) => patientController.list(req, res));

export { patientRouter };
