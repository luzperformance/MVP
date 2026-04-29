import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, getSqliteDb, saveSqlite } from '../models/repositories/Database';
import { authMiddleware, AuthRequest } from '../controllers/middleware/auth';

export const authRouter = Router();

const USE_PG = process.env.USE_PG === 'true';

function getSecret(): string {
  return process.env.JWT_SECRET || 'fallback_secret';
}

function writeAuditLog(action: 'LOGIN' | 'LOGOUT', details: string, ip: string, userAgent: string) {
  try {
    if (USE_PG) {
      pool.query(
        'INSERT INTO audit_log (action, details, ip, user_agent) VALUES ($1, $2, $3, $4)',
        [action, details, ip, userAgent]
      );
    } else {
      const db = getSqliteDb();
      db.prepare(
        'INSERT INTO audit_log (action, details, ip, user_agent) VALUES (?, ?, ?, ?)'
      ).run(action, details, ip, userAgent);
      saveSqlite();
    }
  } catch (e) {
    console.error('audit_log error:', e);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente em 15 minutos.' },
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';

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
      writeAuditLog('LOGIN', `LOGIN_FAILED: email=${email} (not found)`, ip, ua);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const valid = await bcrypt.compare(password, doctor.password_hash || '');
    if (!valid) {
      writeAuditLog('LOGIN', `LOGIN_FAILED: email=${email}`, ip, ua);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email },
      getSecret(),
      { expiresIn: '8h' }
    );

    writeAuditLog('LOGIN', `LOGIN_SUCCESS: doctorId=${doctor.id} email=${doctor.email}`, ip, ua);

    return res.json({
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        crm: doctor.crm,
        can_access_records: USE_PG ? !!doctor.can_access_records : doctor.can_access_records === 1,
        can_edit_agenda: USE_PG ? !!doctor.can_edit_agenda : doctor.can_edit_agenda === 1,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/auth/me — retorna dados do médico autenticado
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let doctor: any = null;

    if (USE_PG) {
      const { rows } = await pool.query('SELECT * FROM doctor WHERE id = $1', [req.doctorId]);
      doctor = rows[0];
    } else {
      const db = getSqliteDb();
      doctor = db.prepare('SELECT * FROM doctor WHERE id = ?').get(req.doctorId);
    }

    if (!doctor) {
      return res.status(404).json({ error: 'Médico não encontrado.' });
    }

    return res.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      crm: doctor.crm,
      can_access_records: USE_PG ? !!doctor.can_access_records : doctor.can_access_records === 1,
      can_edit_agenda: USE_PG ? !!doctor.can_edit_agenda : doctor.can_edit_agenda === 1,
    });
  } catch (err: any) {
    console.error('/me error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  writeAuditLog('LOGOUT', `LOGOUT: doctorId=${req.doctorId}`, ip, ua);
  return res.json({ message: 'Logout registrado.' });
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
      db.prepare(
        'INSERT OR IGNORE INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin) VALUES (?, ?, ?, ?, 1, 1, 1)'
      ).run(email, hash, name, crm);
      saveSqlite();
    }

    return res.status(201).json({ message: 'Conta criada.' });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});
