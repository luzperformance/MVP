import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../controllers/middleware/auth';
import { processTranscription } from '../services/gemini';

export const transcriptionRouter = Router();
transcriptionRouter.use(authMiddleware);

// POST /api/ai/process-transcript
transcriptionRouter.post('/process-transcript', async (req: AuthRequest, res: Response) => {
  const { raw_input, patient_context } = req.body;

  if (!raw_input || raw_input.trim().length < 50) {
    return res.status(400).json({ error: 'Transcrição muito curta. Mínimo 50 caracteres.' });
  }

  const soap = await processTranscription(raw_input, patient_context);
  return res.json(soap);
});
