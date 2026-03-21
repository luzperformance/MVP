import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const campaignsRouter = Router();
campaignsRouter.use(authMiddleware);

const VALID_PLATFORM = ['meta', 'google', 'outro'] as const;
const VALID_STATUS = ['rascunho', 'ativa', 'pausada', 'encerrada'] as const;

function isPlatform(p: unknown): p is (typeof VALID_PLATFORM)[number] {
  return typeof p === 'string' && (VALID_PLATFORM as readonly string[]).includes(p);
}
function isStatus(s: unknown): s is (typeof VALID_STATUS)[number] {
  return typeof s === 'string' && (VALID_STATUS as readonly string[]).includes(s);
}

function rowToCampaign(row: Record<string, unknown>) {
  return row;
}

// GET /api/campaigns
campaignsRouter.get('/', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM ad_campaigns WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`)
    .all() as Record<string, unknown>[];
  return res.json(rows.map(rowToCampaign));
});

// POST /api/campaigns
campaignsRouter.post('/', (req: AuthRequest, res: Response) => {
  const { name, platform, budget_monthly, start_date, end_date, status, notes } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
  }
  const plat = isPlatform(platform) ? platform : 'outro';
  const st = isStatus(status) ? status : 'rascunho';

  const id = uuidv4();
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO ad_campaigns (id, name, platform, budget_monthly, start_date, end_date, status, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(name).trim(),
    plat,
    budget_monthly != null && budget_monthly !== '' ? Number(budget_monthly) : null,
    start_date || null,
    end_date || null,
    st,
    notes ? String(notes) : null,
    now
  );

  const row = db.prepare('SELECT * FROM ad_campaigns WHERE id = ?').get(id);
  return res.status(201).json(rowToCampaign(row as Record<string, unknown>));
});

// PATCH /api/campaigns/:id
campaignsRouter.patch('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM ad_campaigns WHERE id = ? AND deleted_at IS NULL')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campanha não encontrada.' });

  const { name, platform, budget_monthly, start_date, end_date, status, notes } = req.body;
  const row = db.prepare('SELECT * FROM ad_campaigns WHERE id = ?').get(req.params.id) as Record<string, unknown>;

  const nextName = name !== undefined ? String(name).trim() : (row.name as string);
  if (nextName.length < 2) return res.status(400).json({ error: 'Nome inválido.' });

  let nextPlatform = row.platform as string;
  if (platform !== undefined) {
    if (!isPlatform(platform)) return res.status(400).json({ error: 'Plataforma inválida.' });
    nextPlatform = platform;
  }

  let nextStatus = row.status as string;
  if (status !== undefined) {
    if (!isStatus(status)) return res.status(400).json({ error: 'Status inválido.' });
    nextStatus = status;
  }

  const nextBudget =
    budget_monthly !== undefined
      ? budget_monthly === null || budget_monthly === ''
        ? null
        : Number(budget_monthly)
      : row.budget_monthly;
  const nextStart = start_date !== undefined ? start_date || null : row.start_date;
  const nextEnd = end_date !== undefined ? end_date || null : row.end_date;
  const nextNotes = notes !== undefined ? (notes ? String(notes) : null) : row.notes;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE ad_campaigns SET
      name = ?, platform = ?, budget_monthly = ?, start_date = ?, end_date = ?,
      status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(nextName, nextPlatform, nextBudget, nextStart, nextEnd, nextStatus, nextNotes, now, req.params.id);

  const updated = db.prepare('SELECT * FROM ad_campaigns WHERE id = ?').get(req.params.id);
  return res.json(rowToCampaign(updated as Record<string, unknown>));
});

// DELETE /api/campaigns/:id — soft delete
campaignsRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM ad_campaigns WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campanha não encontrada.' });

  db.prepare(`UPDATE ad_campaigns SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(
    req.params.id
  );
  return res.json({ message: 'Campanha removida.' });
});
