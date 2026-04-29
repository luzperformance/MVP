import { getDb } from './Database';

// Helper for results mapping (shared with Alerts logic)
function dbAll(db: any, sql: string, params: any[] = []): any[] {
  try {
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

export class AlertRepository {
  private db = getDb();

  async getInactivePatients() {
    return dbAll(this.db, `
      SELECT id, name, last_consultation, package_type
      FROM patients
      WHERE deleted_at IS NULL
        AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
        AND last_consultation IS NOT NULL
        AND date(last_consultation) < date('now', '-45 days')
      ORDER BY last_consultation ASC
      LIMIT 20
    `);
  }

  async getExpiringContracts() {
    return dbAll(this.db, `
      SELECT id, name, contract_end, package_type, monthly_value
      FROM patients
      WHERE deleted_at IS NULL
        AND contract_done = 1
        AND contract_end IS NOT NULL
        AND date(contract_end) BETWEEN date('now') AND date('now', '+15 days')
      ORDER BY contract_end ASC
      LIMIT 20
    `);
  }

  async getOverdueExams() {
    return dbAll(this.db, `
      SELECT id, name, last_exam
      FROM patients
      WHERE deleted_at IS NULL
        AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)
        AND last_exam IS NOT NULL
        AND date(last_exam) < date('now', '-90 days')
      ORDER BY last_exam ASC
      LIMIT 20
    `);
  }

  async getHotLeadsNoFollowup() {
    return dbAll(this.db, `
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
  }

  async getOverduePayments() {
    return dbAll(this.db, `
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
  }

  async getConsultationsToday(today: string) {
    return dbAll(this.db, `
      SELECT id, name, next_consultation
      FROM patients
      WHERE deleted_at IS NULL
        AND next_consultation = ?
      ORDER BY name ASC
      LIMIT 10
    `, [today]);
  }

  async getLeadActivityCount(leadId: string): Promise<number> {
    const res = dbAll(this.db, 'SELECT COUNT(*) as c FROM lead_activities WHERE lead_id = ?', [leadId]);
    return res[0]?.c || 0;
  }
}
