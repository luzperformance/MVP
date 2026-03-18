import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initDatabase } from './db/database';
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
import { alertsRouter } from './routes/alerts';
import { publicLeadsRouter } from './routes/publicLeads';
import { lgpdMiddleware } from './middleware/lgpd';
import { logger } from './services/logger';

const app = express();
const PORT = process.env.PORT || 3001;

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
  windowMs: 15 * 60 * 1000, // 15 min
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

// === ROUTES ===
app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/patients', recordsRouter);
app.use('/api/patients', examsRouter);
app.use('/api/patients', photosRouter);
app.use('/api/ai', transcriptionRouter);
app.use('/api/finance', financeRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/consultas', consultasRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/gestao', gestaoRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/public', publicLeadsRouter);

// === HEALTH CHECK ===
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// === ERROR HANDLER ===
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

import { getDb } from './db/database';
import bcrypt from 'bcryptjs';

// === START ===
async function start() {
  await initDatabase();
  
  // Guarantee permissions for luzardi18@gmail.com
  try {
    getDb().prepare(`UPDATE doctor SET can_access_records = 1, can_edit_agenda = 1 WHERE email LIKE '%luzardi18%' OR id = 1;`).run();
    
    // Auto-Reset password temporary fix
    const hash = await bcrypt.hash("1234", 12);
    getDb().prepare(`UPDATE doctor SET password_hash = ? WHERE email LIKE '%luzardi18%';`).run(hash);
    console.log('--- PASSWORD FOR LUZARDI18 RESET TO 1234 ---');
  } catch (e) {
    // Migration might not have run yet if not restarted clearly
  }

  app.listen(PORT, () => {
    logger.info(`🏥 Prontuário API rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Falha ao inicializar servidor', err);
  process.exit(1);
});
