import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/repositories/Database';
import { authMiddleware, AuthRequest } from '../controllers/middleware/auth';
import { processImportWithGemini, processImportDirect, csvToJsonRows } from '../services/leadImporter';
import { scoreLeadWithAI, scoreLeadRuleBased } from '../services/leadScoring';
import { isLlmConfigured } from '../services/llmClient';

export const leadsRouter = Router();

leadsRouter.use(authMiddleware);

const VALID_STATUS = ['novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido'];
const VALID_SOURCE = ['indicacao', 'instagram', 'google', 'site', 'evento', 'outro'];
const VALID_TEMPERATURE = ['frio', 'morno', 'quente'];
const VALID_ACTIVITY_TYPE = ['nota', 'ligacao', 'email', 'whatsapp', 'reuniao', 'proposta', 'outro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function deserializeLead(row: any): any {
  if (!row) return row;
  try { row.tags = row.tags ? JSON.parse(row.tags) : []; } catch { row.tags = []; }
  return row;
}

// GET /api/leads — listar leads
leadsRouter.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { q, status, source, temperature } = req.query;

  let sql = `SELECT * FROM leads WHERE deleted_at IS NULL`;
  const params: string[] = [];

  if (q && typeof q === 'string') {
    sql += ` AND (name LIKE ? OR company LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status && typeof status === 'string' && VALID_STATUS.includes(status)) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (source && typeof source === 'string' && VALID_SOURCE.includes(source)) {
    sql += ` AND source = ?`;
    params.push(source);
  }
  if (temperature && typeof temperature === 'string' && VALID_TEMPERATURE.includes(temperature)) {
    sql += ` AND temperature = ?`;
    params.push(temperature);
  }

  sql += ` ORDER BY created_at DESC LIMIT 200`;
  const rows = db.prepare(sql).all(...params);
  return res.json(rows.map(deserializeLead));
});

// GET /api/leads/summary — KPIs do funil
leadsRouter.get('/summary', (_req: AuthRequest, res: Response) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL').get() as any;
  const byStatus = db.prepare(
    `SELECT status, COUNT(*) as count FROM leads WHERE deleted_at IS NULL GROUP BY status`
  ).all() as any[];
  const bySource = db.prepare(
    `SELECT source, COUNT(*) as count FROM leads WHERE deleted_at IS NULL AND source IS NOT NULL GROUP BY source`
  ).all() as any[];
  const pipeline = db.prepare(
    `SELECT COALESCE(SUM(expected_value), 0) as total FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')`
  ).get() as any;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const converted = db.prepare(
    `SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status = 'convertido' AND converted_at LIKE ?`
  ).get(`${currentMonth}%`) as any;

  const now = new Date().toISOString();
  const pending = db.prepare(
    `SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND next_followup_at <= ? AND status NOT IN ('convertido','perdido')`
  ).get(now) as any;

  return res.json({
    totalLeads: total.c,
    byStatus,
    bySource,
    pipelineValue: pipeline.total,
    convertedThisMonth: converted.c,
    pendingFollowups: pending.c,
  });
});

// POST /api/leads/import/preview — preview import with LLM column mapping
leadsRouter.post('/import/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { data, format, source_hint, use_ai } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Campo "data" é obrigatório (string CSV ou JSON).' });
    }
    if (!format || !['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Campo "format" deve ser "csv" ou "json".' });
    }

    if (use_ai) {
      const result = await processImportWithGemini(data, format, source_hint);
      return res.json(result);
    }

    let rows: object[];
    if (format === 'csv') {
      rows = csvToJsonRows(data);
    } else {
      const parsed = JSON.parse(data);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    }
    const result = processImportDirect(rows);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar importação.';
    return res.status(500).json({ error: msg });
  }
});

// POST /api/leads/import/confirm — insert previewed leads into DB
leadsRouter.post('/import/confirm', (req: AuthRequest, res: Response) => {
  const { leads: leadsToImport } = req.body;
  if (!Array.isArray(leadsToImport) || leadsToImport.length === 0) {
    return res.status(400).json({ error: 'Nenhum lead para importar.' });
  }

  const db = getDb();
  let imported = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT INTO leads (id, name, email, phone, company, source, status, temperature, expected_value, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: typeof leadsToImport) => {
    for (const lead of items) {
      if (!lead.name || String(lead.name).trim().length < 2) { skipped++; continue; }
      const id = uuidv4();
      const tagsJson = Array.isArray(lead.tags) ? JSON.stringify(lead.tags) : null;
      insertStmt.run(
        id, String(lead.name).trim(),
        lead.email || null, lead.phone || null, lead.company || null,
        VALID_SOURCE.includes(lead.source) ? lead.source : null,
        VALID_STATUS.includes(lead.status) ? lead.status : 'novo',
        VALID_TEMPERATURE.includes(lead.temperature) ? lead.temperature : 'morno',
        lead.expected_value != null ? Number(lead.expected_value) : null,
        tagsJson, lead.notes || null
      );
      imported++;
    }
  });

  insertMany(leadsToImport);
  return res.status(201).json({ imported, skipped, total: leadsToImport.length });
});

// POST /api/leads/score/:id — score individual lead with AI
leadsRouter.post('/score/:id', async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL').get(req.params.id) as any;
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  const activitiesCount = (db.prepare('SELECT COUNT(*) as c FROM lead_activities WHERE lead_id = ?').get(req.params.id) as any).c;
  const daysSinceCreation = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);

  try {
    let tags: string[] = [];
    try { tags = lead.tags ? JSON.parse(lead.tags) : []; } catch { /* ignore */ }

    const { use_ai } = req.body;
    let score: number;
    let reasoning: string;
    let suggestedTemp: string | undefined;
    let nextAction: string | undefined;

    if (use_ai !== false && isLlmConfigured()) {
      const result = await scoreLeadWithAI({
        name: lead.name, email: lead.email, phone: lead.phone,
        company: lead.company, source: lead.source, temperature: lead.temperature,
        expected_value: lead.expected_value, tags, notes: lead.notes,
        activities_count: activitiesCount, days_since_creation: daysSinceCreation,
      });
      score = result.score;
      reasoning = result.reasoning;
      suggestedTemp = result.suggested_temperature;
      nextAction = result.next_action;
    } else {
      const result = scoreLeadRuleBased({
        name: lead.name, email: lead.email, phone: lead.phone,
        company: lead.company, source: lead.source, temperature: lead.temperature,
        expected_value: lead.expected_value, tags, activities_count: activitiesCount,
      });
      score = result.score;
      reasoning = result.reasoning;
    }

    db.prepare('UPDATE leads SET score = ?, score_reasoning = ?, scored_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(score, reasoning, req.params.id);

    return res.json({ score, reasoning, suggested_temperature: suggestedTemp, next_action: nextAction });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao pontuar lead.';
    return res.status(500).json({ error: msg });
  }
});

// POST /api/leads/score-all — batch score all unscored or stale-scored leads
leadsRouter.post('/score-all', async (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const leads = db.prepare(
    `SELECT id, name, email, phone, company, source, temperature, expected_value, tags, notes, created_at
     FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')
     AND (scored_at IS NULL OR scored_at < datetime('now', '-7 days'))
     LIMIT 50`
  ).all() as any[];

  let scored = 0;
  for (const lead of leads) {
    try {
      const activitiesCount = (db.prepare('SELECT COUNT(*) as c FROM lead_activities WHERE lead_id = ?').get(lead.id) as any).c;
      let tags: string[] = [];
      try { tags = lead.tags ? JSON.parse(lead.tags) : []; } catch { /* ignore */ }

      const result = scoreLeadRuleBased({
        name: lead.name, email: lead.email, phone: lead.phone,
        company: lead.company, source: lead.source, temperature: lead.temperature,
        expected_value: lead.expected_value, tags, activities_count: activitiesCount,
      });

      db.prepare('UPDATE leads SET score = ?, score_reasoning = ?, scored_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(result.score, result.reasoning, lead.id);
      scored++;
    } catch { /* skip individual failures */ }
  }

  return res.json({ scored, total: leads.length });
});

// GET /api/leads/duplicates — find potential duplicate leads
leadsRouter.get('/duplicates', (_req: AuthRequest, res: Response) => {
  const db = getDb();

  const emailDups = db.prepare(`
    SELECT email, GROUP_CONCAT(id) as ids, GROUP_CONCAT(name) as names, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL AND email IS NOT NULL AND email != ''
    GROUP BY LOWER(email) HAVING count > 1
  `).all() as any[];

  const phoneDups = db.prepare(`
    SELECT phone, GROUP_CONCAT(id) as ids, GROUP_CONCAT(name) as names, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL AND phone IS NOT NULL AND phone != ''
    GROUP BY REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') HAVING count > 1
  `).all() as any[];

  const nameDups = db.prepare(`
    SELECT LOWER(name) as normalized_name, GROUP_CONCAT(id) as ids, GROUP_CONCAT(name) as names, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)) HAVING count > 1
  `).all() as any[];

  return res.json({
    byEmail: emailDups.map(d => ({ ...d, ids: d.ids.split(','), names: d.names.split(',') })),
    byPhone: phoneDups.map(d => ({ ...d, ids: d.ids.split(','), names: d.names.split(',') })),
    byName: nameDups.map(d => ({ ...d, ids: d.ids.split(','), names: d.names.split(',') })),
    totalDuplicateGroups: emailDups.length + phoneDups.length + nameDups.length,
  });
});

// GET /api/leads/hygiene — data hygiene report (stale leads, missing data, overdue follow-ups)
leadsRouter.get('/hygiene', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const now = new Date().toISOString();

  const staleLeads = db.prepare(`
    SELECT id, name, status, updated_at, last_activity_at
    FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')
    AND updated_at < datetime('now', '-30 days')
    ORDER BY updated_at ASC LIMIT 50
  `).all() as any[];

  const overdueFollowups = db.prepare(`
    SELECT id, name, status, next_followup_at, temperature
    FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')
    AND next_followup_at IS NOT NULL AND next_followup_at <= ?
    ORDER BY next_followup_at ASC
  `).all(now) as any[];

  const missingData = db.prepare(`
    SELECT id, name,
      CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END as missing_email,
      CASE WHEN phone IS NULL OR phone = '' THEN 1 ELSE 0 END as missing_phone,
      CASE WHEN source IS NULL THEN 1 ELSE 0 END as missing_source
    FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')
    AND (email IS NULL OR email = '' OR phone IS NULL OR phone = '' OR source IS NULL)
    LIMIT 50
  `).all() as any[];

  const noActivity = db.prepare(`
    SELECT l.id, l.name, l.status, l.created_at
    FROM leads l LEFT JOIN lead_activities a ON l.id = a.lead_id
    WHERE l.deleted_at IS NULL AND l.status NOT IN ('convertido','perdido')
    AND a.id IS NULL AND l.created_at < datetime('now', '-3 days')
    ORDER BY l.created_at ASC LIMIT 50
  `).all() as any[];

  return res.json({
    staleLeads: { count: staleLeads.length, leads: staleLeads },
    overdueFollowups: { count: overdueFollowups.length, leads: overdueFollowups },
    missingData: { count: missingData.length, leads: missingData },
    noActivity: { count: noActivity.length, leads: noActivity },
    healthScore: Math.max(0, 100 - (staleLeads.length * 3) - (overdueFollowups.length * 5) - (noActivity.length * 2)),
  });
});

// GET /api/leads/analytics — enhanced analytics with conversion rates and velocity
leadsRouter.get('/analytics', (_req: AuthRequest, res: Response) => {
  const db = getDb();

  const totalActive = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status NOT IN (\'convertido\',\'perdido\')').get() as any).c;
  const totalConverted = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status = \'convertido\'').get() as any).c;
  const totalLost = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status = \'perdido\'').get() as any).c;
  const totalAll = totalActive + totalConverted + totalLost;

  const conversionRate = totalAll > 0 ? Math.round((totalConverted / totalAll) * 100) : 0;
  const lossRate = totalAll > 0 ? Math.round((totalLost / totalAll) * 100) : 0;

  const avgScore = (db.prepare('SELECT AVG(score) as avg FROM leads WHERE deleted_at IS NULL AND score > 0').get() as any)?.avg || 0;

  const avgDaysToConvert = (db.prepare(`
    SELECT AVG(JULIANDAY(converted_at) - JULIANDAY(created_at)) as avg_days
    FROM leads WHERE deleted_at IS NULL AND status = 'convertido' AND converted_at IS NOT NULL
  `).get() as any)?.avg_days || 0;

  const byTemperature = db.prepare(`
    SELECT temperature, COUNT(*) as count FROM leads
    WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido') AND temperature IS NOT NULL
    GROUP BY temperature
  `).all() as any[];

  const monthlyConversions = db.prepare(`
    SELECT strftime('%Y-%m', converted_at) as month, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL AND status = 'convertido' AND converted_at IS NOT NULL
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all() as any[];

  const monthlyNew = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all() as any[];

  const topSources = db.prepare(`
    SELECT source, COUNT(*) as total,
      SUM(CASE WHEN status = 'convertido' THEN 1 ELSE 0 END) as converted
    FROM leads WHERE deleted_at IS NULL AND source IS NOT NULL
    GROUP BY source ORDER BY total DESC
  `).all() as any[];

  return res.json({
    totalActive, totalConverted, totalLost, totalAll,
    conversionRate, lossRate,
    avgScore: Math.round(avgScore),
    avgDaysToConvert: Math.round(avgDaysToConvert),
    byTemperature,
    monthlyConversions, monthlyNew,
    topSources: topSources.map((s: any) => ({
      ...s,
      conversion_rate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
    })),
  });
});

// GET /api/leads/:id — detalhe
leadsRouter.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  const activities = db.prepare(
    'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  return res.json({ ...deserializeLead(lead), activities });
});

// POST /api/leads — criar
leadsRouter.post('/', (req: AuthRequest, res: Response) => {
  const { name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
  }
  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido.' });
  }
  if (source && !VALID_SOURCE.includes(source)) {
    return res.status(400).json({ error: 'Origem inválida.' });
  }
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  if (temperature && !VALID_TEMPERATURE.includes(temperature)) {
    return res.status(400).json({ error: 'Temperatura inválida.' });
  }

  let tagsJson: string | null = null;
  if (tags) {
    const arr = Array.isArray(tags) ? tags : (() => { try { return JSON.parse(tags); } catch { return null; } })();
    if (!Array.isArray(arr)) return res.status(400).json({ error: 'Tags deve ser um array.' });
    tagsJson = JSON.stringify(arr);
  }

  const id = uuidv4();
  const db = getDb();
  db.prepare(`
    INSERT INTO leads (id, name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, String(name).trim(), email || null, phone || null, company || null,
    source || null, status || 'novo', temperature || 'morno',
    expected_value != null ? Number(expected_value) : null,
    tagsJson, notes || null, next_followup_at || null
  );

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return res.status(201).json(deserializeLead(lead));
});

// PUT /api/leads/:id — atualizar (with auto-activity on status change)
leadsRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Lead não encontrado.' });

  const { name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at, lost_reason } = req.body;

  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido.' });
  }
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  let tagsJson: string | undefined;
  if (tags !== undefined) {
    const arr = Array.isArray(tags) ? tags : (() => { try { return JSON.parse(tags); } catch { return null; } })();
    if (!Array.isArray(arr)) return res.status(400).json({ error: 'Tags deve ser um array.' });
    tagsJson = JSON.stringify(arr);
  }

  const STATUS_LABELS: { [k: string]: string } = {
    novo: 'Novo', contato: 'Contato', qualificado: 'Qualificado',
    proposta: 'Proposta', convertido: 'Convertido', perdido: 'Perdido',
  };

  const doUpdate = db.transaction(() => {
    db.prepare(`
      UPDATE leads SET
        name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
        company = COALESCE(?, company), source = COALESCE(?, source), status = COALESCE(?, status),
        temperature = COALESCE(?, temperature), expected_value = COALESCE(?, expected_value),
        tags = COALESCE(?, tags), notes = COALESCE(?, notes),
        next_followup_at = COALESCE(?, next_followup_at), lost_reason = COALESCE(?, lost_reason),
        last_activity_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null, email, phone, company, source, status, temperature,
      expected_value != null ? Number(expected_value) : null,
      tagsJson ?? null, notes, next_followup_at, lost_reason, req.params.id
    );

    if (status && status !== existing.status) {
      const oldLabel = STATUS_LABELS[existing.status] || existing.status;
      const newLabel = STATUS_LABELS[status] || status;
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, type, description)
        VALUES (?, ?, 'outro', ?)
      `).run(uuidv4(), req.params.id, `Status alterado: ${oldLabel} → ${newLabel}`);

      if (status === 'perdido' && lost_reason) {
        db.prepare(`
          INSERT INTO lead_activities (id, lead_id, type, description)
          VALUES (?, ?, 'nota', ?)
        `).run(uuidv4(), req.params.id, `Motivo da perda: ${lost_reason}`);
      }
    }
  });
  doUpdate([]);

  return res.json(deserializeLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id)));
});

// DELETE /api/leads/:id — soft delete
leadsRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE leads SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Lead removido.' });
});

// POST /api/leads/:id/convert — converter lead em paciente
leadsRouter.post('/:id/convert', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL').get(req.params.id) as any;
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
  if (lead.status === 'convertido') return res.status(409).json({ error: 'Lead já foi convertido.' });

  const { birth_date } = req.body;
  if (!birth_date) return res.status(400).json({ error: 'Data de nascimento é obrigatória para criar paciente.' });

  const patientId = uuidv4();

  const convert = db.transaction(() => {
    db.prepare(`
      INSERT INTO patients (id, name, phone, email, lgpd_consent_at, lgpd_consent_ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(patientId, lead.name, lead.phone || null, lead.email || null, new Date().toISOString(), req.ip);

    db.prepare(`
      UPDATE patients SET birth_date = ? WHERE id = ?
    `).run(birth_date, patientId);

    db.prepare(`
      UPDATE leads SET patient_id = ?, status = 'convertido', converted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(patientId, req.params.id);
  });
  convert([]);

  const updatedLead = deserializeLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

  return res.status(201).json({ lead: updatedLead, patient });
});

// === ATIVIDADES ===

// GET /api/leads/:id/activities
leadsRouter.get('/:id/activities', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const activities = db.prepare(
    'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  return res.json(activities);
});

// POST /api/leads/:id/activities
leadsRouter.post('/:id/activities', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const lead = db.prepare('SELECT id FROM leads WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  const { type, description, scheduled_at } = req.body;
  if (!type || !VALID_ACTIVITY_TYPE.includes(type)) {
    return res.status(400).json({ error: 'Tipo de atividade inválido.' });
  }
  if (!description || String(description).trim().length === 0) {
    return res.status(400).json({ error: 'Descrição é obrigatória.' });
  }

  const id = uuidv4();
  const doInsert = db.transaction(() => {
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, type, description, scheduled_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.id, type, String(description).trim(), scheduled_at || null);
    db.prepare('UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  });
  doInsert([]);

  return res.status(201).json(db.prepare('SELECT * FROM lead_activities WHERE id = ?').get(id));
});

// PUT /api/leads/:id/activities/:aid
leadsRouter.put('/:id/activities/:aid', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM lead_activities WHERE id = ? AND lead_id = ?').get(req.params.aid, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Atividade não encontrada.' });

  const { description, completed_at, scheduled_at } = req.body;
  db.prepare(`
    UPDATE lead_activities SET
      description = COALESCE(?, description),
      completed_at = COALESCE(?, completed_at),
      scheduled_at = COALESCE(?, scheduled_at)
    WHERE id = ?
  `).run(description || null, completed_at || null, scheduled_at || null, req.params.aid);

  return res.json(db.prepare('SELECT * FROM lead_activities WHERE id = ?').get(req.params.aid));
});

// DELETE /api/leads/:id/activities/:aid
leadsRouter.delete('/:id/activities/:aid', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM lead_activities WHERE id = ? AND lead_id = ?').run(req.params.aid, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Atividade não encontrada.' });
  return res.json({ message: 'Atividade removida.' });
});
