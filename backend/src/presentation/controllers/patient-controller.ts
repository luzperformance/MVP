import { Request, Response } from 'express';
import { ListPatientsUseCase } from '../../application/use_cases/list-patients';

export class PatientController {
  constructor(private listPatientsUseCase: ListPatientsUseCase) {}

  async list(req: Request, res: Response) {
    try {
      const patients = await this.listPatientsUseCase.execute();
      return res.json(patients);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
