import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const gestaoRouter = Router();
gestaoRouter.use(authMiddleware);

const MGMT_FIELDS = `
  id, name, cpf_encrypted, birth_date, gender, email, phone, phone2,
  address, cep, city, state, insurance_name, insurance_plan,
  first_consultation, last_consultation, next_consultation,
  last_prescription, last_exam, mgmt_status, uses_ea, wants_children,
  observations, notes, origin, package_type, monthly_value, payment_date,
  needs_nf, contract_done, contract_start, contract_end, contract_notes,
  created_at, updated_at
`;

function deserializeRow(row: any): any {
  if (!row) return row;
  row.uses_ea = !!row.uses_ea;
  row.wants_children = !!row.wants_children;
  row.needs_nf = !!row.needs_nf;
  row.contract_done = !!row.contract_done;
  return row;
}

// GET /api/gestao — list all patients for management table
gestaoRouter.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { q, status, state, package_type } = req.query;

  let sql = `SELECT ${MGMT_FIELDS} FROM patients WHERE deleted_at IS NULL`;
  const params: string[] = [];

  if (q && typeof q === 'string') {
    sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status && typeof status === 'string') {
    sql += ` AND mgmt_status = ?`;
    params.push(status);
  }
  if (state && typeof state === 'string') {
    sql += ` AND state = ?`;
    params.push(state);
  }
  if (package_type && typeof package_type === 'string') {
    sql += ` AND package_type = ?`;
    params.push(package_type);
  }

  sql += ` ORDER BY name ASC LIMIT 500`;
  const rows = db.prepare(sql).all(...params);
  return res.json(rows.map(deserializeRow));
});

// GET /api/gestao/summary — KPIs for the management dashboard
gestaoRouter.get('/summary', (_req: AuthRequest, res: Response) => {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL').get() as any).c;
  const ativos = (db.prepare("SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL)").get() as any).c;
  const inativos = (db.prepare("SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND mgmt_status = 'inativo'").get() as any).c;

  const mrr = (db.prepare(
    "SELECT COALESCE(SUM(monthly_value), 0) as total FROM patients WHERE deleted_at IS NULL AND (mgmt_status = 'ativo' OR mgmt_status IS NULL) AND monthly_value > 0"
  ).get() as any).total;

  const withContract = (db.prepare(
    "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND contract_done = 1"
  ).get() as any).c;

  const pendingNF = (db.prepare(
    "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND needs_nf = 1"
  ).get() as any).c;

  const now = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcomingConsultations = (db.prepare(
    "SELECT COUNT(*) as c FROM patients WHERE deleted_at IS NULL AND next_consultation BETWEEN ? AND ?"
  ).get(now, nextWeek) as any).c;

  const byPackage = db.prepare(
    "SELECT package_type as type, COUNT(*) as count FROM patients WHERE deleted_at IS NULL AND package_type IS NOT NULL GROUP BY package_type ORDER BY count DESC"
  ).all() as any[];

  const byState = db.prepare(
    "SELECT state, COUNT(*) as count FROM patients WHERE deleted_at IS NULL AND state IS NOT NULL AND state != '' GROUP BY state ORDER BY count DESC LIMIT 10"
  ).all() as any[];

  return res.json({ total, ativos, inativos, mrrTotal: mrr, withContract, pendingNF, upcomingConsultations, byPackage, byState });
});

// PUT /api/gestao/:id — update a patient's management fields (inline edit)
gestaoRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Paciente não encontrado.' });

  const {
    name, cpf_encrypted, birth_date, gender, email, phone, phone2,
    address, cep, city, state, insurance_name, insurance_plan,
    first_consultation, last_consultation, next_consultation,
    last_prescription, last_exam, mgmt_status, uses_ea, wants_children,
    observations, notes, origin, package_type, monthly_value, payment_date,
    needs_nf, contract_done, contract_start, contract_end, contract_notes,
  } = req.body;

  db.prepare(`
    UPDATE patients SET
      name = COALESCE(?, name),
      cpf_encrypted = COALESCE(?, cpf_encrypted),
      birth_date = COALESCE(?, birth_date),
      gender = COALESCE(?, gender),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      phone2 = COALESCE(?, phone2),
      address = COALESCE(?, address),
      cep = COALESCE(?, cep),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      insurance_name = COALESCE(?, insurance_name),
      insurance_plan = COALESCE(?, insurance_plan),
      first_consultation = COALESCE(?, first_consultation),
      last_consultation = COALESCE(?, last_consultation),
      next_consultation = COALESCE(?, next_consultation),
      last_prescription = COALESCE(?, last_prescription),
      last_exam = COALESCE(?, last_exam),
      mgmt_status = COALESCE(?, mgmt_status),
      uses_ea = COALESCE(?, uses_ea),
      wants_children = COALESCE(?, wants_children),
      observations = COALESCE(?, observations),
      notes = COALESCE(?, notes),
      origin = COALESCE(?, origin),
      package_type = COALESCE(?, package_type),
      monthly_value = COALESCE(?, monthly_value),
      payment_date = COALESCE(?, payment_date),
      needs_nf = COALESCE(?, needs_nf),
      contract_done = COALESCE(?, contract_done),
      contract_start = COALESCE(?, contract_start),
      contract_end = COALESCE(?, contract_end),
      contract_notes = COALESCE(?, contract_notes)
    WHERE id = ?
  `).run(
    name ?? null, cpf_encrypted ?? null, birth_date ?? null, gender ?? null,
    email ?? null, phone ?? null, phone2 ?? null,
    address ?? null, cep ?? null, city ?? null, state ?? null,
    insurance_name ?? null, insurance_plan ?? null,
    first_consultation ?? null, last_consultation ?? null, next_consultation ?? null,
    last_prescription ?? null, last_exam ?? null,
    mgmt_status ?? null,
    uses_ea != null ? (uses_ea ? 1 : 0) : null,
    wants_children != null ? (wants_children ? 1 : 0) : null,
    observations ?? null, notes ?? null, origin ?? null, package_type ?? null,
    monthly_value != null ? Number(monthly_value) : null,
    payment_date ?? null,
    needs_nf != null ? (needs_nf ? 1 : 0) : null,
    contract_done != null ? (contract_done ? 1 : 0) : null,
    contract_start ?? null, contract_end ?? null, contract_notes ?? null,
    req.params.id
  );

  const updated = db.prepare(`SELECT ${MGMT_FIELDS} FROM patients WHERE id = ?`).get(req.params.id);
  return res.json(deserializeRow(updated));
});

// POST /api/gestao/import — import CSV in the same format as the spreadsheet
gestaoRouter.post('/import', (req: AuthRequest, res: Response) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Nenhum dado para importar.' });
  }

  const db = getDb();
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const GENDER_MAP: { [k: string]: string } = {
    masculino: 'M', feminino: 'F', m: 'M', f: 'F', masc: 'M', fem: 'F',
  };
  const PKG_MAP: { [k: string]: string } = {
    mensal: 'mensal', trimestral: 'trimestral', semestral: 'semestral', anual: 'anual',
    'mensal, trimestral': 'mensal',
  };

  function safeStr(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  }

  function pickFirst(...keys: string[]): (row: any) => string | null {
    return (row: any) => {
      for (const k of keys) {
        const v = safeStr(row[k]);
        if (v) return v;
      }
      return null;
    };
  }

  function parseDate(v: string | undefined | null): string | null {
    if (!v || !String(v).trim()) return null;
    const s = String(v).trim();

    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      let day = parseInt(slashMatch[1], 10);
      let month = parseInt(slashMatch[2], 10);
      const year = slashMatch[3];

      if (day > 12 && month <= 12) {
        // DD/MM/YYYY (normal BR format, day > 12 is unambiguous)
      } else if (month > 12 && day <= 12) {
        // MM/DD/YYYY (swap)
        [day, month] = [month, day];
      }
      // If both <= 12, assume DD/MM/YYYY (BR format)
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const isoMatch = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    const slashBR = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (slashBR) {
      let day = parseInt(slashBR[1], 10);
      let month = parseInt(slashBR[2], 10);
      const year = parseInt(slashBR[3], 10) < 50 ? `20${slashBR[3]}` : `19${slashBR[3]}`;
      if (month > 12 && day <= 12) [day, month] = [month, day];
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return null;
  }

  function parseMoney(v: string | undefined | null): number | null {
    if (!v || !String(v).trim()) return null;
    const cleaned = String(v).replace(/[R$\s.]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  function parseBool(v: string | undefined | null): number | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim().toLowerCase();
    if (!s) return null;
    if (['sim', 'yes', '1', 'true', 's'].includes(s)) return 1;
    if (['não', 'nao', 'no', '0', 'false', 'n', 'fazer'].includes(s)) return 0;
    return null;
  }

  const getName = pickFirst('Nome completo', 'name', 'nome', 'Nome');
  const getCpf = pickFirst('CPF', 'cpf');
  const getEmail = pickFirst('E-mail', 'email', 'Email');
  const getPhone = pickFirst('Tel 1', 'phone', 'Telefone', 'Phone');
  const getPhone2 = pickFirst('Tel 2', 'phone2');
  const getAddress = pickFirst('Endereço', 'address', 'Endereco');
  const getCep = pickFirst('Cep', 'CEP', 'cep');
  const getCity = pickFirst('Cidade', 'city');
  const getState = pickFirst('Estado', 'state', 'UF');
  const getInsurance = pickFirst('Convênio', 'Convenio', 'insurance_name');
  const getInsurancePlan = pickFirst('Plano de saúde', 'Plano de saude', 'insurance_plan');
  const getOrigin = pickFirst('Origem', 'origin');
  const getObs = pickFirst('Obs', 'observations', 'Observações', 'Observacoes');
  const getContractNotes = pickFirst('contract_notes', 'Observações contrato');

  const findByName = db.prepare('SELECT id FROM patients WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL');

  for (const row of rows) {
    const name = getName(row);
    if (!name || name.length < 2) { skipped++; continue; }

    const existing = findByName.get(name) as any;
    if (existing) { updated++; continue; }

    try {
      const id = uuidv4();
      const genderRaw = safeStr(row['Sexo'] || row['gender']);
      const gender = genderRaw ? (GENDER_MAP[genderRaw.toLowerCase()] || null) : null;
      const pkgRaw = safeStr(row['pacote'] || row['package_type'] || row['Pacote']);
      const pkg = pkgRaw ? (PKG_MAP[pkgRaw.toLowerCase()] || null) : null;
      const statusRaw = safeStr(row['Status'] || row['status']) || 'ativo';
      const mgmtStatus = ['ativo', 'inativo'].includes(statusRaw.toLowerCase()) ? statusRaw.toLowerCase() : 'ativo';

      db.prepare(`
        INSERT INTO patients (
          id, name, cpf_encrypted, birth_date, gender, email, phone, phone2,
          address, cep, city, state, insurance_name, insurance_plan,
          first_consultation, last_consultation, next_consultation,
          last_prescription, last_exam, mgmt_status, uses_ea, wants_children,
          observations, origin, package_type, monthly_value, payment_date,
          needs_nf, contract_done, contract_start, contract_end, contract_notes,
          lgpd_consent_at, lgpd_consent_ip
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )
      `).run(
        id, name,
        getCpf(row),
        parseDate(row['Data de nascimento'] || row['birth_date']),
        gender,
        getEmail(row),
        getPhone(row),
        getPhone2(row),
        getAddress(row),
        getCep(row),
        getCity(row),
        getState(row),
        getInsurance(row),
        getInsurancePlan(row),
        parseDate(row['Primeira Consulta'] || row['first_consultation']),
        parseDate(row['Última Consulta'] || row['last_consultation'] || row['Ultima Consulta']),
        parseDate(row['Próxima Consulta'] || row['next_consultation'] || row['Proxima Consulta']),
        parseDate(row['Ultima receita'] || row['last_prescription']),
        parseDate(row['Ultimo Exame'] || row['last_exam']),
        mgmtStatus,
        parseBool(row['Ja fazia uso EA'] || row['uses_ea']),
        parseBool(row['Pensa ter filhos'] || row['wants_children']),
        getObs(row),
        getOrigin(row),
        pkg,
        parseMoney(row['Valor/ mensal'] || row['Valor/mensal'] || row['monthly_value']),
        parseDate(row['data pagamento'] || row['Data pagamento'] || row['payment_date']),
        parseBool(row['Necessita NF'] || row['needs_nf']),
        parseBool(row['Contrato feito/Ass.'] || row['contract_done']),
        parseDate(row['Inicio contrato'] || row['contract_start']),
        parseDate(row['Venc Contrato'] || row['contract_end']),
        getContractNotes(row),
        new Date().toISOString(),
        'import'
      );
      imported++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      errors.push(`Linha "${name}": ${msg}`);
      skipped++;
    }
  }

  return res.status(201).json({ imported, updated, skipped, total: rows.length, errors });
});
