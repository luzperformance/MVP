import { Router } from 'express';
import { DoctorController } from '../controllers/doctor-controller';
import { AuthenticateDoctorUseCase } from '../../application/use_cases/authenticate-doctor';
import { SQLiteDoctorRepository } from '../../infrastructure/database/repositories/sqlite-doctor-repository';
import { BcryptHashService } from '../../infrastructure/external_services/bcrypt-hash-service';

const doctorRouter = Router();

// Manual Dependency Injection
const doctorRepository = new SQLiteDoctorRepository();
const hashService = new BcryptHashService();
const authenticateUseCase = new AuthenticateDoctorUseCase(doctorRepository, hashService);
const doctorController = new DoctorController(authenticateUseCase);

doctorRouter.post('/login', (req, res) => doctorController.login(req, res));

export { doctorRouter };
