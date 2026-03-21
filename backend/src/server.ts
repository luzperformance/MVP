import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import bcrypt from 'bcryptjs';
import { initDatabase, getSqliteDb, saveSqlite, pool } from './db/database';
import { authRouter } from './routes/auth';
import { patientsRouter } from './routes/patients';
import { recordsRouter } from './routes/records';
import { examsRouter } from './routes/exams';
import { photosRouter } from './routes/photos';
import { transcriptionRouter } from './routes/transcription';
import { financeRouter } from './routes/finance';
import { calendarRouter } from './routes/calendar';
import { consultasRouter } from './routes/consultas';
import { leadsRouter } from './routes/leads';
import { assetsRouter } from './routes/assets';
import { gestaoRouter } from './routes/gestao';
import { campaignsRouter } from './routes/campaigns';
import { alertsRouter } from './routes/alerts';
import { publicLeadsRouter } from './routes/publicLeads';
import { biLayoutsRouter } from './routes/biLayouts';
import { lgpdMiddleware } from './middleware/lgpd';
import { logger } from './services/logger';

const app = express();
const PORT = process.env.PORT || 3001;
const USE_PG = process.env.USE_PG === 'true';

// === SECURITY ===
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'https://prontuario.luzperformance.com.br',
      'https://www.luzperformance.com',
      'https://luzperformance.com',
    ];
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
}));

// === PARSERS ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === STATIC FILES (uploads) ===
const uploadPath = path.resolve(process.env.UPLOAD_PATH || './uploads');
app.use('/uploads', express.static(uploadPath));

// === LGPD AUDIT LOG (before routes) ===
app.use(lgpdMiddleware);

// === AUTH ROUTES ===
app.use('/api/auth', authRouter);

// === ROUTES ===
app.use('/api/patients', patientsRouter);
app.use('/api/patients', recordsRouter);
app.use('/api/patients', examsRouter);
app.use('/api/patients', photosRouter);
app.use('/api/patients', biLayoutsRouter);
app.use('/api/ai', transcriptionRouter);
app.use('/api/finance', financeRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/consultas', consultasRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/gestao', gestaoRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/public', publicLeadsRouter);

// === HEALTH CHECK ===
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', mode: USE_PG ? 'postgresql' : 'sqlite', timestamp: new Date().toISOString() });
});

// === ERROR HANDLER ===
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// === SEED DEFAULT USERS ===
async function seedDefaultUsers() {
  const users = [
    {
      email: 'drluzardi93@gmail.com',
      password: 'teste1',
      name: 'Dr. Vinícius Luzardi',
      crm: 'SC-33489',
      can_access_records: true,
      can_edit_agenda: true,
      is_admin: true,
    },
    {
      email: 'almeidadanigomes@gmail.com',
      password: 'Dani@123',
      name: 'Dani Gomes Almeida (Secretária)',
      crm: 'N/A',
      can_access_records: false,
      can_edit_agenda: true,
      is_admin: true,
    },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);

    if (USE_PG) {
      await pool.query(
        `INSERT INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = $2,
           name = $3,
           crm = $4,
           can_access_records = $5,
           can_edit_agenda = $6,
           is_admin = $7`,
        [u.email, hash, u.name, u.crm, u.can_access_records, u.can_edit_agenda, u.is_admin]
      );
    } else {
      const db = getSqliteDb();
      // Upsert: insert or update password
      db.run(
        `INSERT INTO doctor (email, password_hash, name, crm, can_access_records, can_edit_agenda, is_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           password_hash = excluded.password_hash,
           name = excluded.name,
           crm = excluded.crm,
           can_access_records = excluded.can_access_records,
           can_edit_agenda = excluded.can_edit_agenda,
           is_admin = excluded.is_admin`,
        [u.email, hash, u.name, u.crm, u.can_access_records ? 1 : 0, u.can_edit_agenda ? 1 : 0, u.is_admin ? 1 : 0]
      );
    }
    console.log(`  ✅ ${u.email} → senha: ${u.password}`);
  }

  if (!USE_PG) saveSqlite();
}

// === START ===
async function start() {
  await initDatabase();
  await seedDefaultUsers();

  app.listen(PORT, () => {
    logger.info(`🏥 Prontuário API rodando na porta ${PORT} (${USE_PG ? 'PostgreSQL' : 'SQLite'})`);
    console.log(`\n🔗 http://localhost:${PORT}/api/health\n`);
  });
}

start().catch((err) => {
  logger.error('Falha ao inicializar servidor', err);
  process.exit(1);
});
