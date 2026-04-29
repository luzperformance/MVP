import { getDb } from './Database';
import { v4 as uuidv4 } from 'uuid';

export interface GestaoPatient {
  id: string;
  name: string;
  cpf_encrypted?: string;
  birth_date: string;
  gender?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  cep?: string;
  city?: string;
  state?: string;
  insurance_name?: string;
  insurance_plan?: string;
  first_consultation?: string;
  last_consultation?: string;
  next_consultation?: string;
  last_prescription?: string;
  last_exam?: string;
  mgmt_status?: string;
  uses_ea?: boolean | number;
  wants_children?: boolean | number;
  observations?: string;
  notes?: string;
  origin?: string;
  package_type?: string;
  monthly_value?: number;
  payment_date?: string;
  needs_nf?: boolean | number;
  contract_done?: boolean | number;
  contract_start?: string;
  contract_end?: string;
  contract_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class GestaoRepository {
  private db = getDb();
  
  private MGMT_FIELDS = `
    id, name, cpf_encrypted, birth_date, gender, email, phone, phone2,
    address, cep, city, state, insurance_name, insurance_plan,
    first_consultation, last_consultation, next_consultation,
    last_prescription, last_exam, mgmt_status, uses_ea, wants_children,
    observations, notes, origin, package_type, monthly_value, payment_date,
    needs_nf, contract_done, contract_start, contract_end, contract_notes,
    created_at, updated_at
  `;

  async findAll(filters: { q?: string; status?: string; state?: string; package_type?: string }): Promise<GestaoPatient[]> {
    let sql = `SELECT ${this.MGMT_FIELDS} FROM patients WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (filters.q) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)`;
      params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    }
    if (filters.status) {
      sql += ` AND mgmt_status = ?`;
      params.push(filters.status);
    }
    if (filters.state) {
      sql += ` AND state = ?`;
      params.push(filters.state);
    }
    if (filters.package_type) {
      sql += ` AND package_type = ?`;
      params.push(filters.package_type);
    }

    sql += ` ORDER BY name ASC LIMIT 500`;
    return this.db.prepare(sql).all(...params) as GestaoPatient[];
  }

  async getSummary() {
    const total = (this.db.prepare('SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL').get() as any).c;
    const ativos = (this.db.prepare("SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)").get() as any).c;
    const inativos = (this.db.prepare("SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND mgmt_status = 'inativo'").get() as any).c;

    const mrr = (this.db.prepare(
      "SELECT COALESCE(SUM(monthly_value), 0) as total FROM patients WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL) AND monthly_value > 0"
    ).get() as any).total;

    const withContract = (this.db.prepare(
      "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND contract_done = 1"
    ).get() as any).c;

    const pendingNF = (this.db.prepare(
      "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND needs_nf = 1"
    ).get() as any).c;

    const now = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const upcomingConsultations = (this.db.prepare(
      "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND next_consultation BETWEEN ? AND ?"
    ).get(now, nextWeek) as any).c;

    const byPackage = this.db.prepare(
      "SELECT package_type as type, COUNT(*) as count FROM patients WHERE deleted_at IS NULL AND package_type IS NOT NULL GROUP BY package_type ORDER BY count DESC"
    ).all() as any[];

    const byState = this.db.prepare(
      "SELECT state, COUNT(*) as count FROM patients WHERE deleted_at IS NULL AND state IS NOT NULL AND state != '' GROUP BY state ORDER BY count DESC LIMIT 10"
    ).all() as any[];

    return { total, ativos, inativos, mrrTotal: mrr, withContract, pendingNF, upcomingConsultations, byPackage, byState };
  }

  async update(id: string, data: Partial<GestaoPatient>): Promise<GestaoPatient | null> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return this.findById(id);

    // Convert booleans to 0/1 for SQLite
    const processedData = { ...data } as any;
    ['uses_ea', 'wants_children', 'needs_nf', 'contract_done'].forEach(k => {
      if (k in processedData && typeof processedData[k] === 'boolean') {
        processedData[k] = processedData[k] ? 1 : 0;
      }
    });

    const setClause = fields.map(f => `${f} = COALESCE(?, ${f})`).join(', ');
    const params = fields.map(f => processedData[f] ?? null);
    params.push(id);

    this.db.prepare(`UPDATE patients SET ${setClause} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  async findById(id: string): Promise<GestaoPatient | null> {
    const row = this.db.prepare(`SELECT ${this.MGMT_FIELDS} FROM patients WHERE id = ? AND deleted_at IS NULL`).get(id);
    return (row as GestaoPatient) || null;
  }

  async findByName(name: string): Promise<{ id: string } | null> {
    return this.db.prepare('SELECT id FROM patients WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL').get(name) as any;
  }

  async create(data: any) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const columns = fields.join(', ');
    const values = fields.map(f => data[f]);

    this.db.prepare(`INSERT INTO patients (${columns}) VALUES (${placeholders})`).run(...values);
  }
}
