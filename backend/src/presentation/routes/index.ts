import { Router } from 'express';
import { doctorRouter } from './doctor-routes';
import { patientRouter } from './patient-routes';

const apiRouter = Router();

apiRouter.use('/auth', doctorRouter);
apiRouter.use('/patients', patientRouter);

export { apiRouter };
