import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, getSqliteDb, saveSqlite } from '../db/database';
import { rateLimit } from 'express-rate-limit';

export const authRouter = Router();

const USE_PG = process.env.USE_PG === 'true';

// Rate limit rigoroso no login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente em 15 minutos.' },
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    let doctor: any = null;

    if (USE_PG) {
      const { rows } = await pool.query('SELECT * FROM doctor WHERE email = $1', [email]);
      doctor = rows[0];
    } else {
      const db = getSqliteDb();
      doctor = db.prepare('SELECT * FROM doctor WHERE email = ?').get(email);
    }

    if (!doctor) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const valid = await bcrypt.compare(password, doctor.password_hash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        crm: doctor.crm,
        can_access_records: USE_PG ? !!doctor.can_access_records : doctor.can_access_records === 1,
        can_edit_agenda: USE_PG ? !!doctor.can_edit_agenda : doctor.can_edit_agenda === 1
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, crm } = req.body;
    const hash = await bcrypt.hash(password, 12);

    if (USE_PG) {
      await pool.query(
        'INSERT INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin) VALUES ($1, $2, $3, $4, TRUE, TRUE, TRUE) ON CONFLICT (email) DO NOTHING',
        [email, hash, name, crm]
      );
    } else {
      const db = getSqliteDb();
      db.run(
        'INSERT OR IGNORE INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin) VALUES (?, ?, ?, ?, 1, 1, 1)',
        [email, hash, name, crm]
      );
      saveSqlite();
    }

    return res.status(201).json({ message: 'Conta criada.' });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/auth/logout (no-op, stateless JWT)
authRouter.post('/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logout OK.' });
});
