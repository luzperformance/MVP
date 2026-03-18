import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const assetsRouter = Router();
assetsRouter.use(authMiddleware);

const VALID_TYPE = ['equipamento', 'protocolo', 'suplemento', 'contrato', 'documento', 'outro'];
const VALID_STATUS = ['ativo', 'inativo', 'vendido', 'expirado'];

function deserializeAsset(row: any): any {
  if (!row) return row;
  try { row.metadata = row.metadata ? JSON.parse(row.metadata) : {}; } catch { row.metadata = {}; }
  return row;
}

// GET /api/assets — listar
assetsRouter.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { q, type, status, lead_id } = req.query;

  let sql = `SELECT * FROM assets WHERE deleted_at IS NULL`;
  const params: string[] = [];

  if (q && typeof q === 'string') {
    sql += ` AND name LIKE ?`;
    params.push(`%${q}%`);
  }
  if (type && typeof type === 'string' && VALID_TYPE.includes(type)) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  if (status && typeof status === 'string' && VALID_STATUS.includes(status)) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (lead_id && typeof lead_id === 'string') {
    sql += ` AND lead_id = ?`;
    params.push(lead_id);
  }

  sql += ` ORDER BY created_at DESC LIMIT 200`;
  const rows = db.prepare(sql).all(...params);
  return res.json(rows.map(deserializeAsset));
});

// GET /api/assets/:id — detalhe
assetsRouter.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const asset = db.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Ativo não encontrado.' });
  return res.json(deserializeAsset(asset));
});

// POST /api/assets — criar
assetsRouter.post('/', (req: AuthRequest, res: Response) => {
  const { name, type, status, value, acquisition_date, expiration_date, description, metadata, lead_id, patient_id } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
  }
  if (!type || !VALID_TYPE.includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  let metadataJson: string | null = null;
  if (metadata) {
    if (typeof metadata === 'object') metadataJson = JSON.stringify(metadata);
    else if (typeof metadata === 'string') {
      try { JSON.parse(metadata); metadataJson = metadata; } catch {
        return res.status(400).json({ error: 'Metadata deve ser JSON válido.' });
      }
    }
  }

  const id = uuidv4();
  const db = getDb();
  db.prepare(`
    INSERT INTO assets (id, lead_id, patient_id, name, type, status, value, acquisition_date, expiration_date, description, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, lead_id || null, patient_id || null, String(name).trim(), type,
    status || 'ativo', value != null ? Number(value) : null,
    acquisition_date || null, expiration_date || null,
    description || null, metadataJson
  );

  return res.status(201).json(deserializeAsset(db.prepare('SELECT * FROM assets WHERE id = ?').get(id)));
});

// PUT /api/assets/:id — atualizar
assetsRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM assets WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ativo não encontrado.' });

  const { name, type, status, value, acquisition_date, expiration_date, description, metadata, lead_id, patient_id } = req.body;

  let metadataJson: string | undefined;
  if (metadata !== undefined) {
    if (typeof metadata === 'object') metadataJson = JSON.stringify(metadata);
    else if (typeof metadata === 'string') {
      try { JSON.parse(metadata); metadataJson = metadata; } catch {
        return res.status(400).json({ error: 'Metadata deve ser JSON válido.' });
      }
    }
  }

  db.prepare(`
    UPDATE assets SET
      name = COALESCE(?, name), type = COALESCE(?, type), status = COALESCE(?, status),
      value = COALESCE(?, value), acquisition_date = COALESCE(?, acquisition_date),
      expiration_date = COALESCE(?, expiration_date), description = COALESCE(?, description),
      metadata = COALESCE(?, metadata), lead_id = COALESCE(?, lead_id), patient_id = COALESCE(?, patient_id)
    WHERE id = ?
  `).run(
    name || null, type || null, status || null,
    value != null ? Number(value) : null,
    acquisition_date, expiration_date, description,
    metadataJson ?? null, lead_id, patient_id,
    req.params.id
  );

  return res.json(deserializeAsset(db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id)));
});

// DELETE /api/assets/:id — soft delete
assetsRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE assets SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Ativo removido.' });
});
