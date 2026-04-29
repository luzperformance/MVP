import { Request, Response } from 'express';
import { AuthService } from '../../models/services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }

      const result = await this.authService.authenticate(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      return res.json(result);
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, crm } = req.body;
      await this.authService.register({ email, password_hash: password, name, crm });
      return res.status(201).json({ message: 'Conta criada.' });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  async logout(_req: Request, res: Response) {
    return res.json({ message: 'Logout OK.' });
  }
}
