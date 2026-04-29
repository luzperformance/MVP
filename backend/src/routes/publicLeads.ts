import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/repositories/Database';
import { scoreLeadWithAI, scoreLeadRuleBased } from '../services/leadScoring';
import { isLlmConfigured } from '../services/llmClient';

export const publicLeadsRouter = Router();

// POST /api/public/leads — captura de lead via landing externa (sem Auth)
publicLeadsRouter.post('/leads', async (req, res: Response) => {
  const db = getDb();

  const {
    name,
    email,
    phone,
    company,
    source,
    use_ai,
  }: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    use_ai?: boolean;
  } = req.body ?? {};

  const safeName = cleanStr(name);
  if (!safeName || safeName.length < 2) {
    return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
  }

  const safeEmail = cleanStr(email)?.toLowerCase() || null;
  const safePhone = cleanStr(phone) || null;
  const safeCompany = cleanStr(company) || null;
  const leadSource = source && ['indicacao', 'instagram', 'google', 'site', 'evento', 'outro'].includes(source)
    ? source
    : 'site';

  // Deduplicacao: primeiro por email, depois por telefone normalizado (quando possível).
  let existingId: string | null = null;
  if (safeEmail) {
    const existing = db.prepare(`
      SELECT id FROM leads
      WHERE deleted_at IS NULL AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1
    `).get(safeEmail) as any;
    existingId = existing?.id || null;
  }

  if (!existingId && safePhone) {
    const norm = normalizePhone(safePhone);
    const existing = db.prepare(`
      SELECT id FROM leads
      WHERE deleted_at IS NULL AND phone IS NOT NULL
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'.','') = ?
      LIMIT 1
    `).get(norm) as any;
    existingId = existing?.id || null;
  }

  const id = existingId || uuidv4();
  const created = !existingId;

  // Guard: bancos antigos podem não ter a coluna `last_activity_at`
  // (migration 004). Se não existir, evitamos crash no UPDATE.
  const leadColumns = db.prepare('PRAGMA table_info(leads)').all() as any[];
  const hasLastActivityAt = leadColumns.some(c => c?.name === 'last_activity_at');

  if (created) {
    db.prepare(`
      INSERT INTO leads (id, name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      safeName,
      safeEmail,
      safePhone,
      safeCompany,
      leadSource,
      'novo',
      'morno',
      null,
      JSON.stringify([]),
      null,
      null,
    );

    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, type, description)
      VALUES (?, ?, 'outro', ?)
    `).run(uuidv4(), id, 'Contato via landing page (captura pública).');
  } else {
    // Mantemos status/temperature/source intactos; apenas atualizamos "atividade" e notas se vazias.
    if (hasLastActivityAt) {
      db.prepare(`
        UPDATE leads SET
          last_activity_at = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, ?)
        WHERE id = ?
      `).run('Contato via landing page (captura pública).', id);
    } else {
      db.prepare(`
        UPDATE leads SET
          notes = COALESCE(notes, ?)
        WHERE id = ?
      `).run('Contato via landing page (captura pública).', id);
    }

    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, type, description)
      VALUES (?, ?, 'outro', ?)
    `).run(uuidv4(), id, 'Contato via landing page (captura pública).');
  }

  // Opcional: scoring imediato (somente score/razão; não mexe em status/temperature para não afetar fluxos externos).
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;

  let score: number | null = null;
  let reasoning: string | null = null;
  let suggestedTemperature: string | undefined;
  let nextAction: string | undefined;

  const wantAI = use_ai !== false && isLlmConfigured();
  try {
    if (wantAI) {
      const tags = (() => {
        try {
          return lead.tags ? JSON.parse(lead.tags) : [];
        } catch {
          return [];
        }
      })();

      const result = await scoreLeadWithAI({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        temperature: lead.temperature,
        expected_value: lead.expected_value,
        tags,
        notes: lead.notes,
        activities_count: (db.prepare('SELECT COUNT(*) as c FROM lead_activities WHERE lead_id = ?').get(id) as any).c,
        days_since_creation: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000),
      });

      score = result.score;
      reasoning = result.reasoning;
      suggestedTemperature = result.suggested_temperature;
      nextAction = result.next_action;
    } else {
      const result = scoreLeadRuleBased({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        temperature: lead.temperature,
        expected_value: lead.expected_value,
        tags: [],
      });
      score = result.score;
      reasoning = result.reasoning;
    }
  } catch {
    // Nunca derrubamos a captura pública por erro de scoring.
  }

  if (score != null && reasoning != null) {
    db.prepare('UPDATE leads SET score = ?, score_reasoning = ?, scored_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(score, reasoning, id);
  }

  const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
  return res.status(201).json({
    created,
    lead: {
      id: updatedLead.id,
      name: updatedLead.name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      source: updatedLead.source,
      status: updatedLead.status,
      temperature: updatedLead.temperature,
      score: updatedLead.score,
      score_reasoning: updatedLead.score_reasoning,
      scored_at: updatedLead.scored_at,
    },
    scoring: {
      suggested_temperature: suggestedTemperature,
      next_action: nextAction,
    },
  });
});

function cleanStr(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}
