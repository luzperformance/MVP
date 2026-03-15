import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';
import { rateLimit } from 'express-rate-limit';

export const authRouter = Router();

// Rate limit rigoroso no login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente em 15 minutos.' },
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const db = getDb();
  const doctor = db.prepare('SELECT * FROM doctor WHERE email = ?').get(email) as any;

  if (!doctor) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const valid = await bcrypt.compare(password, doctor.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { doctorId: doctor.id, email: doctor.email },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  // Audit log
  db.prepare(
    'INSERT INTO audit_log (action, entity, ip, details) VALUES (?, ?, ?, ?)'
  ).run('LOGIN', 'doctor', req.ip, `Login: ${email}`);

  return res.json({
    token,
    doctor: { id: doctor.id, name: doctor.name, email: doctor.email, crm: doctor.crm },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare(
    'INSERT INTO audit_log (action, entity, ip) VALUES (?, ?, ?)'
  ).run('LOGOUT', 'doctor', req.ip);

  return res.json({ message: 'Logout realizado.' });
});

// POST /api/auth/setup — primeiro acesso (criar conta do médico)
authRouter.post('/setup', async (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM doctor WHERE id = 1').get();
  if (existing) {
    return res.status(409).json({ error: 'Conta já configurada.' });
  }

  const { email, password, name, crm } = req.body;
  if (!email || !password || !name || !crm) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare(
    'INSERT INTO doctor (id, email, password_hash, name, crm) VALUES (1, ?, ?, ?, ?)'
  ).run(email, hash, name, crm);

  return res.status(201).json({ message: 'Conta criada com sucesso.' });
});
