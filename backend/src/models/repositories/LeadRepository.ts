import { getDb } from './Database';
import { LeadEntity, ActivityEntity } from '../entities/Lead';
import { v4 as uuidv4 } from 'uuid';

export class LeadRepository {
  db = getDb();

  private deserializeLead(row: any): LeadEntity {
    if (!row) return row;
    try { row.tags = row.tags ? JSON.parse(row.tags) : []; } catch { row.tags = []; }
    return row;
  }

  async find(filters: any): Promise<LeadEntity[]> {
    const { q, status, source, temperature } = filters;
    let sql = `SELECT * FROM leads WHERE deleted_at IS NULL`;
    const params: string[] = [];

    if (q) {
      sql += ` AND (name LIKE ? OR company LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (source) {
      sql += ` AND source = ?`;
      params.push(source);
    }
    if (temperature) {
      sql += ` AND temperature = ?`;
      params.push(temperature);
    }

    sql += ` ORDER BY created_at DESC LIMIT 200`;
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r: any) => this.deserializeLead(r));
  }

  async findById(id: string): Promise<LeadEntity | null> {
    const row = this.db.prepare('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL').get(id);
    return row ? this.deserializeLead(row) : null;
  }

  async findByEmail(email: string): Promise<LeadEntity | null> {
    const row = this.db.prepare(`
      SELECT * FROM leads 
      WHERE deleted_at IS NULL AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1
    `).get(email);
    return row ? this.deserializeLead(row) : null;
  }

  async findByPhone(phone: string): Promise<LeadEntity | null> {
    const norm = phone.replace(/[ ()-]/g, '').replace(/\./g, '');
    const row = this.db.prepare(`
      SELECT * FROM leads 
      WHERE deleted_at IS NULL AND phone IS NOT NULL 
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'.','') = ?
      LIMIT 1
    `).get(norm);
    return row ? this.deserializeLead(row) : null;
  }

  async getSummary() {
    const total = this.db.prepare('SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL').get() as any;
    const byStatus = this.db.prepare(
      `SELECT status, COUNT(*) as count FROM leads WHERE deleted_at IS NULL GROUP BY status`
    ).all() as any[];
    const bySource = this.db.prepare(
      `SELECT source, COUNT(*) as count FROM leads WHERE deleted_at IS NULL AND source IS NOT NULL GROUP BY source`
    ).all() as any[];
    const pipeline = this.db.prepare(
      `SELECT COALESCE(SUM(expected_value), 0) as total FROM leads WHERE deleted_at IS NULL AND status NOT IN ('convertido','perdido')`
    ).get() as any;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const converted = this.db.prepare(
      `SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status = 'convertido' AND converted_at LIKE ?`
    ).get(`${currentMonth}%`) as any;

    const now = new Date().toISOString();
    const pending = this.db.prepare(
      `SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND next_followup_at <= ? AND status NOT IN ('convertido','perdido')`
    ).get(now) as any;

    return {
      totalLeads: total.c,
      byStatus,
      bySource,
      pipelineValue: pipeline.total,
      convertedThisMonth: converted.c,
      pendingFollowups: pending.c,
    };
  }

  async create(data: Partial<LeadEntity>): Promise<LeadEntity> {
    const id = uuidv4();
    const { name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at } = data;
    const tagsJson = tags ? JSON.stringify(tags) : null;

    this.db.prepare(`
      INSERT INTO leads (id, name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name?.trim(), email || null, phone || null, company || null,
      source || null, status || 'novo', temperature || 'morno',
      expected_value != null ? Number(expected_value) : null,
      tagsJson, notes || null, next_followup_at || null
    );

    return this.findById(id) as Promise<LeadEntity>;
  }

  async update(id: string, data: any, existingStatus?: string): Promise<LeadEntity | null> {
    const { name, email, phone, company, source, status, temperature, expected_value, tags, notes, next_followup_at, lost_reason } = data;
    const tagsJson = tags !== undefined ? JSON.stringify(tags) : undefined;

    const doUpdate = this.db.transaction(() => {
      this.db.prepare(`
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
        tagsJson ?? null, notes, next_followup_at, lost_reason, id
      );

      if (status && status !== existingStatus) {
        this.addStatusChangeActivity(id, existingStatus!, status, lost_reason);
      }
    });

    doUpdate([]);
    return this.findById(id);
  }

  private addStatusChangeActivity(leadId: string, oldStatus: string, newStatus: string, lostReason?: string) {
    const STATUS_LABELS: { [k: string]: string } = {
      novo: 'Novo', contato: 'Contato', qualificado: 'Qualificado',
      proposta: 'Proposta', convertido: 'Convertido', perdido: 'Perdido',
    };
    const oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
    const newLabel = STATUS_LABELS[newStatus] || newStatus;

    this.db.prepare(`
      INSERT INTO lead_activities (id, lead_id, type, description)
      VALUES (?, ?, 'outro', ?)
    `).run(uuidv4(), leadId, `Status alterado: ${oldLabel} → ${newLabel}`);

    if (newStatus === 'perdido' && lostReason) {
      this.db.prepare(`
        INSERT INTO lead_activities (id, lead_id, type, description)
        VALUES (?, ?, 'nota', ?)
      `).run(uuidv4(), leadId, `Motivo da perda: ${lostReason}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    this.db.prepare('UPDATE leads SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }

  async convertToPatient(leadId: string, patientId: string, birthDate: string, lgpdIp: string) {
    const lead = this.db.prepare('SELECT name, phone, email FROM leads WHERE id = ?').get(leadId) as any;
    
    const convert = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO patients (id, name, phone, email, birth_date, lgpd_consent_at, lgpd_consent_ip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(patientId, lead.name, lead.phone || null, lead.email || null, birthDate, new Date().toISOString(), lgpdIp);

      this.db.prepare(`
        UPDATE leads SET patient_id = ?, status = 'convertido', converted_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(patientId, leadId);
    });
    convert([]);
  }

  // Activities
  async findActivities(leadId: string) {
    return this.db.prepare(
      'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC'
    ).all(leadId);
  }

  async createActivity(activity: any) {
    const { id, lead_id, type, description, scheduled_at } = activity;
    const doInsert = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO lead_activities (id, lead_id, type, description, scheduled_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, lead_id, type, description.trim(), scheduled_at || null);
      this.db.prepare('UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?').run(lead_id);
    });
    doInsert([]);
    return this.db.prepare('SELECT * FROM lead_activities WHERE id = ?').get(id);
  }
}
