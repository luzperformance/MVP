import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = /\.csv$/i.test(file.originalname) || (file.mimetype === 'text/csv');
    cb(null, !!ok);
  },
});

/** Parse one CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        if (line[end] === '"' && (line[end + 1] === ',' || line[end + 1] === undefined || line[end + 1] === '\r')) break;
        if (line[end] === '"' && line[end + 1] === '"') end += 2; // escaped quote
        else end += 1;
      }
      out.push(line.slice(i + 1, end).replace(/""/g, '"').trim());
      i = line[end] === ',' ? end + 1 : end;
    } else {
      const comma = line.indexOf(',', i);
      const value = comma === -1 ? line.slice(i) : line.slice(i, comma);
      out.push(value.trim());
      i = comma === -1 ? line.length : comma + 1;
    }
  }
  return out;
}

/** Normalize header to internal key */
const HEADER_MAP: Record<string, string> = {
  tipo: 'type', type: 'type',
  categoria: 'category', category: 'category',
  valor: 'amount', amount: 'amount', value: 'amount',
  data: 'entry_date', entry_date: 'entry_date', date: 'entry_date',
  descricao: 'description', description: 'description',
};

function parseCsvToRows(csvBuffer: Buffer): { headers: string[]; rows: string[][] } {
  const text = csvBuffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map(h => HEADER_MAP[h.toLowerCase().trim()] || h.toLowerCase().trim());
  const rows = lines.slice(1).map(l => parseCsvLine(l));
  return { headers, rows };
}

function normalizeType(v: string): 'revenue' | 'expense' | null {
  const s = (v || '').toLowerCase().trim();
  if (['receita', 'revenue', 'r'].includes(s)) return 'revenue';
  if (['despesa', 'expense', 'd', 'despesas'].includes(s)) return 'expense';
  return null;
}

function normalizeDate(v: string): string | null {
  const s = (v || '').trim();
  if (!s) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/) || s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const [a, b, c] = m[1].length === 4 ? [m[3], m[2], m[1]] : [m[1], m[2], m[3]];
    const d = a.padStart(2, '0');
    const mo = b.padStart(2, '0');
    const y = c.padStart(4, '0');
    return `${y}-${mo}-${d}`;
  }
  return null;
}

function parseAmount(v: string): number | null {
  const s = (v || '').trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export const financeRouter = Router();
financeRouter.use(authMiddleware);

/** GET /api/finance/summary — KPIs e dados para o dashboard (receita, despesa, resultado por mês) */
financeRouter.get('/summary', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { period = '6' } = req.query; // meses a considerar
  const months = Math.min(12, Math.max(1, parseInt(period as string, 10) || 6));

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const revenueRows = db.prepare(`
    SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
    FROM finance_entries WHERE type = 'revenue' AND entry_date >= ?
    GROUP BY strftime('%Y-%m', entry_date)
    ORDER BY month
  `).all(cutoffStr) as { month: string; total: number }[];

  const expenseRows = db.prepare(`
    SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
    FROM finance_entries WHERE type = 'expense' AND entry_date >= ?
    GROUP BY strftime('%Y-%m', entry_date)
    ORDER BY month
  `).all(cutoffStr) as { month: string; total: number }[];

  const byMonth: Record<string, { month: string; revenue: number; expense: number; result: number }> = {};
  revenueRows.forEach(r => {
    if (!byMonth[r.month]) byMonth[r.month] = { month: r.month, revenue: 0, expense: 0, result: 0 };
    byMonth[r.month].revenue = r.total;
  });
  expenseRows.forEach(r => {
    if (!byMonth[r.month]) byMonth[r.month] = { month: r.month, revenue: 0, expense: 0, result: 0 };
    byMonth[r.month].expense = r.total;
  });
  Object.keys(byMonth).forEach(m => {
    byMonth[m].result = byMonth[m].revenue - byMonth[m].expense;
  });

  const monthly = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

  const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0);
  const totalExpense = monthly.reduce((s, r) => s + r.expense, 0);
  const result = totalRevenue - totalExpense;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const current = monthly.find(m => m.month === currentMonth) || { revenue: 0, expense: 0, result: 0 };

  return res.json({
    kpis: {
      revenueMonth: current.revenue,
      expenseMonth: current.expense,
      resultMonth: current.result,
      revenueTotal: totalRevenue,
      expenseTotal: totalExpense,
      resultTotal: result,
    },
    monthly,
    periodMonths: months,
  });
});

/** GET /api/finance/entries — Lista lançamentos com filtro opcional */
financeRouter.get('/entries', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { type, from, to } = req.query;
  let sql = 'SELECT * FROM finance_entries WHERE 1=1';
  const params: (string | number)[] = [];
  if (type === 'revenue' || type === 'expense') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (from && typeof from === 'string') {
    sql += ' AND entry_date >= ?';
    params.push(from);
  }
  if (to && typeof to === 'string') {
    sql += ' AND entry_date <= ?';
    params.push(to);
  }
  sql += ' ORDER BY entry_date DESC, created_at DESC LIMIT 100';
  const entries = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
  return res.json(entries);
});

/** POST /api/finance/entries — Cria lançamento */
financeRouter.post('/entries', (req: AuthRequest, res: Response) => {
  const { type, category, amount, entry_date, description } = req.body;
  if (!type || !category || amount == null || !entry_date) {
    return res.status(400).json({ error: 'type, category, amount e entry_date são obrigatórios.' });
  }
  if (type !== 'revenue' && type !== 'expense') {
    return res.status(400).json({ error: 'type deve ser revenue ou expense.' });
  }
  const value = parseFloat(amount);
  if (Number.isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'amount deve ser um número positivo.' });
  }
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO finance_entries (id, type, category, amount, entry_date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, type, category, Math.abs(value), entry_date, description || null);
  const row = db.prepare('SELECT * FROM finance_entries WHERE id = ?').get(id);
  return res.status(201).json(row);
});

/** DELETE /api/finance/entries/:id */
financeRouter.delete('/entries/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM finance_entries WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Lançamento não encontrado.' });
  return res.json({ message: 'Lançamento removido.' });
});

/** POST /api/finance/import — Importa lançamentos a partir de CSV (planilha) */
financeRouter.post('/import', upload.single('file'), (req: AuthRequest, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file || !file.buffer || file.buffer.length === 0) {
    return res.status(400).json({ error: 'Envie um arquivo CSV.' });
  }
  const { headers, rows } = parseCsvToRows(file.buffer);
  const idx = (key: string) => headers.indexOf(key);
  const typeCol = idx('type');
  const categoryCol = idx('category');
  const amountCol = idx('amount');
  const dateCol = idx('entry_date');
  const descCol = idx('description');

  if (typeCol < 0 || categoryCol < 0 || amountCol < 0 || dateCol < 0) {
    return res.status(400).json({
      error: 'CSV deve ter cabeçalho com colunas: tipo (ou type), categoria (ou category), valor (ou amount), data (ou entry_date). Opcional: descricao (ou description).',
      example: 'tipo,categoria,valor,data,descricao\nreceita,Consultas,1500,2025-01-15,Consulta\ndespesa,Aluguel,2000,2025-01-10,',
    });
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO finance_entries (id, type, category, amount, entry_date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const typeVal = typeCol < row.length ? normalizeType(row[typeCol]) : null;
    const categoryVal = categoryCol < row.length ? (row[categoryCol] || '').trim() : '';
    const amountVal = amountCol < row.length ? parseAmount(row[amountCol]) : null;
    const dateVal = dateCol < row.length ? normalizeDate(row[dateCol]) : null;
    const descVal = descCol >= 0 && descCol < row.length ? (row[descCol] || '').trim() || null : null;

    if (!typeVal) {
      errors.push({ row: i + 2, message: 'Tipo deve ser receita ou despesa.' });
      continue;
    }
    if (!categoryVal) {
      errors.push({ row: i + 2, message: 'Categoria obrigatória.' });
      continue;
    }
    if (amountVal == null) {
      errors.push({ row: i + 2, message: 'Valor inválido.' });
      continue;
    }
    if (!dateVal) {
      errors.push({ row: i + 2, message: 'Data inválida (use AAAA-MM-DD ou DD/MM/AAAA).' });
      continue;
    }

    try {
      insert.run(uuidv4(), typeVal, categoryVal, amountVal, dateVal, descVal);
      imported++;
    } catch (e) {
      errors.push({ row: i + 2, message: String((e as Error).message) });
    }
  }

  return res.json({
    imported,
    totalRows: rows.length,
    errors: errors.length ? errors : undefined,
    message: `${imported} lançamento(s) importado(s).${errors.length ? ` ${errors.length} linha(s) com erro.` : ''}`,
  });
});
