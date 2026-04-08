import { Request, Response } from 'express';
import { AuthenticateDoctorUseCase } from '../../application/use_cases/authenticate-doctor';

export class DoctorController {
  constructor(private authenticateDoctorUseCase: AuthenticateDoctorUseCase) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const result = await this.authenticateDoctorUseCase.execute({
        email,
        passwordHash: password,
      });

      return res.json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
}
