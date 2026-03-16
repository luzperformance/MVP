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
import { lgpdMiddleware } from './middleware/lgpd';
import { logger } from './services/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// === SECURITY ===
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://prontuario.luzperformance.com.br'
    : 'http://localhost:5173',
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

// === HEALTH CHECK ===
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// === ERROR HANDLER ===
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// === START ===
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    logger.info(`🏥 Prontuário API rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Falha ao inicializar servidor', err);
  process.exit(1);
});
