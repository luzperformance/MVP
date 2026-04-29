import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  doctorId?: number;
  doctorEmail?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const payload = jwt.verify(token, secret) as { doctorId: number; email: string };
    req.doctorId = payload.doctorId;
    req.doctorEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
