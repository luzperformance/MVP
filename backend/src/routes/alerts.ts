import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

// sql.js exec() wrapper — returns array of plain objects (compatible with sql.js AND pg)
function dbAll(db: any, sql: string, params: any[] = []): any[] {
  // PG pool path: use .query() if available
  if (typeof db.query === 'function' && typeof db.prepare !== 'function') {
    // Should not happen synchronously — alerts is SQLite-only for now
    return [];
  }
  try {
    // sql.js: exec() returns [{columns, values}]
    const results: { columns: string[]; values: any[][] }[] = db.exec(sql, params);
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  } catch {
    return [];
  }
}

function dbGet(db: any, sql: string, params: any[] = []): any {
  const rows = dbAll(db, sql, params);
  return rows[0] ?? null;
}

export const alertsRouter = Router();
alertsRouter.use(authMiddleware);

interface Alert {
  id: string;
  type: 'patient_inactive' | 'contract_expiring' | 'exam_overdue' | 'lead_hot_no_followup' | 'payment_overdue' | 'consultation_today';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity_type: 'patient' | 'lead';
  entity_id: string;
  entity_name: string;
  action_url: string;
  created_at: string;
  data?: Record<string, unknown>;
}

// GET /api/alerts — all active alerts
alertsRouter.get('/', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const alerts: Alert[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // 1. Pacientes inativos (sem consulta há mais de 45 dias sendo ativos)
  const inactivePatients = dbAll(db, `
    SELECT id, name, last_consultation, package_type
    FROM patients
    WHERE deleted_at IS NULL
      AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND last_consultation IS NOT NULL
      AND date(last_consultation) < date('now', '-45 days')
    ORDER BY last_consultation ASC
    LIMIT 20
  `);

  for (const p of inactivePatients) {
    const days = Math.floor((now.getTime() - new Date(p.last_consultation).getTime()) / 86400000);
    alerts.push({
      id: `inactive-${p.id}`,
      type: 'patient_inactive',
      severity: days > 90 ? 'high' : 'medium',
      title: 'Paciente inativo',
      description: `${p.name} não tem consulta há ${days} dias`,
      entity_type: 'patient',
      entity_id: p.id,
      entity_name: p.name,
      action_url: `/patients/${p.id}`,
      created_at: now.toISOString(),
      data: { days_inactive: days, package_type: p.package_type },
    });
  }

  // 2. Contratos vencendo em 15 dias
  const expiringContracts = dbAll(db, `
    SELECT id, name, contract_end, package_type, monthly_value
    FROM patients
    WHERE deleted_at IS NULL
      AND contract_done = 1
      AND contract_end IS NOT NULL
      AND date(contract_end) BETWEEN date('now') AND date('now', '+15 days')
    ORDER BY contract_end ASC
    LIMIT 20
  `);

  for (const p of expiringContracts) {
    const daysLeft = Math.ceil((new Date(p.contract_end).getTime() - now.getTime()) / 86400000);
    alerts.push({
      id: `contract-${p.id}`,
      type: 'contract_expiring',
      severity: daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
      title: 'Contrato vencendo',
      description: `Contrato de ${p.name} vence em ${daysLeft} dias`,
      entity_type: 'patient',
      entity_id: p.id,
      entity_name: p.name,
      action_url: `/crm/seguimento`,
      created_at: now.toISOString(),
      data: { days_left: daysLeft, contract_end: p.contract_end, monthly_value: p.monthly_value },
    });
  }

  // 3. Exames vencidos (último exame há mais de 90 dias para pacientes ativos)
  const overdueExams = dbAll(db, `
    SELECT id, name, last_exam
    FROM patients
    WHERE deleted_at IS NULL
      AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND last_exam IS NOT NULL
      AND date(last_exam) < date('now', '-90 days')
    ORDER BY last_exam ASC
    LIMIT 20
  `);

  for (const p of overdueExams) {
    const days = Math.floor((now.getTime() - new Date(p.last_exam).getTime()) / 86400000);
    alerts.push({
      id: `exam-${p.id}`,
      type: 'exam_overdue',
      severity: days > 180 ? 'high' : 'medium',
      title: 'Exame desatualizado',
      description: `${p.name} não faz exames há ${days} dias`,
      entity_type: 'patient',
      entity_id: p.id,
      entity_name: p.name,
      action_url: `/patients/${p.id}/exams`,
      created_at: now.toISOString(),
      data: { days_since_exam: days, last_exam: p.last_exam },
    });
  }

  // 4. Leads quentes sem follow-up (temperatura quente/morno, sem atividade há 3+ dias)
  const hotLeadsNoFollowup = dbAll(db, `
    SELECT id, name, temperature, status, last_activity_at, expected_value
    FROM leads
    WHERE deleted_at IS NULL
      AND status NOT IN ('convertido', 'perdido')
      AND temperature IN ('quente', 'morno')
      AND (
        last_activity_at IS NULL
        OR date(last_activity_at) < date('now', '-3 days')
      )
    ORDER BY 
      CASE temperature WHEN 'quente' THEN 1 WHEN 'morno' THEN 2 ELSE 3 END,
      last_activity_at ASC
    LIMIT 15
  `);

  for (const l of hotLeadsNoFollowup) {
    const days = l.last_activity_at
      ? Math.floor((now.getTime() - new Date(l.last_activity_at).getTime()) / 86400000)
      : null;
    alerts.push({
      id: `lead-${l.id}`,
      type: 'lead_hot_no_followup',
      severity: l.temperature === 'quente' ? 'high' : 'medium',
      title: `Lead ${l.temperature} sem contato`,
      description: days ? `${l.name} sem atividade há ${days} dias` : `${l.name} nunca foi contatado`,
      entity_type: 'lead',
      entity_id: l.id,
      entity_name: l.name,
      action_url: `/crm/leads/${l.id}`,
      created_at: now.toISOString(),
      data: { temperature: l.temperature, days_inactive: days, expected_value: l.expected_value },
    });
  }

  // 5. Pagamentos atrasados (data de pagamento passou e paciente ativo)
  const overduePayments = dbAll(db, `
    SELECT id, name, payment_date, monthly_value, package_type
    FROM patients
    WHERE deleted_at IS NULL
      AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND payment_date IS NOT NULL
      AND date(payment_date) < date('now')
      AND monthly_value > 0
    ORDER BY payment_date ASC
    LIMIT 15
  `);

  for (const p of overduePayments) {
    const days = Math.floor((now.getTime() - new Date(p.payment_date).getTime()) / 86400000);
    alerts.push({
      id: `payment-${p.id}`,
      type: 'payment_overdue',
      severity: days > 7 ? 'high' : 'medium',
      title: 'Pagamento atrasado',
      description: `${p.name} com pagamento atrasado há ${days} dias`,
      entity_type: 'patient',
      entity_id: p.id,
      entity_name: p.name,
      action_url: `/crm/seguimento`,
      created_at: now.toISOString(),
      data: { days_overdue: days, monthly_value: p.monthly_value },
    });
  }

  // 6. Consultas hoje
  const consultationsToday = dbAll(db, `
    SELECT id, name, next_consultation
    FROM patients
    WHERE deleted_at IS NULL
      AND next_consultation = ?
    ORDER BY name ASC
    LIMIT 10
  `, [today]);

  for (const p of consultationsToday) {
    alerts.push({
      id: `today-${p.id}`,
      type: 'consultation_today',
      severity: 'low',
      title: 'Consulta hoje',
      description: `${p.name} tem consulta agendada para hoje`,
      entity_type: 'patient',
      entity_id: p.id,
      entity_name: p.name,
      action_url: `/patients/${p.id}`,
      created_at: now.toISOString(),
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return res.json(alerts);
});

// GET /api/alerts/summary — counts by type
alertsRouter.get('/summary', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const inactive = (dbGet(db, `
    SELECT COUNT(*) as c FROM patients
    WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND last_consultation IS NOT NULL AND date(last_consultation) < date('now', '-45 days')
  `) ?? { c: 0 }).c;

  const contractsExpiring = (dbGet(db, `
    SELECT COUNT(*) as c FROM patients
    WHERE deleted_at IS NULL AND contract_done = 1 AND contract_end IS NOT NULL
      AND date(contract_end) BETWEEN date('now') AND date('now', '+15 days')
  `) ?? { c: 0 }).c;

  const examsOverdue = (dbGet(db, `
    SELECT COUNT(*) as c FROM patients
    WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND last_exam IS NOT NULL AND date(last_exam) < date('now', '-90 days')
  `) ?? { c: 0 }).c;

  const hotLeads = (dbGet(db, `
    SELECT COUNT(*) as c FROM leads
    WHERE deleted_at IS NULL AND status NOT IN ('convertido', 'perdido')
      AND temperature IN ('quente', 'morno')
      AND (last_activity_at IS NULL OR date(last_activity_at) < date('now', '-3 days'))
  `) ?? { c: 0 }).c;

  const paymentsOverdue = (dbGet(db, `
    SELECT COUNT(*) as c FROM patients
    WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
      AND payment_date IS NOT NULL AND date(payment_date) < date('now') AND monthly_value > 0
  `) ?? { c: 0 }).c;

  const consultationsToday = (dbGet(db, `
    SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND next_consultation = ?
  `, [today]) ?? { c: 0 }).c;

  const total = inactive + contractsExpiring + examsOverdue + hotLeads + paymentsOverdue;
  const critical = contractsExpiring;
  const high = inactive + hotLeads + paymentsOverdue;

  return res.json({
    total,
    critical,
    high,
    by_type: {
      patient_inactive: inactive,
      contract_expiring: contractsExpiring,
      exam_overdue: examsOverdue,
      lead_hot_no_followup: hotLeads,
      payment_overdue: paymentsOverdue,
      consultation_today: consultationsToday,
    },
  });
});
