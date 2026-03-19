import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { saveSqlite } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.csv$/i.test(file.originalname) || (file.mimetype === 'text/csv');
    cb(null, !!ok);
  },
});

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        if (line[end] === '"' && (line[end + 1] === ',' || line[end + 1] === undefined || line[end + 1] === '\r')) break;
        if (line[end] === '"' && line[end + 1] === '"') end += 2;
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/) || s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const [a, b, c] = m[1].length === 4 ? [m[3], m[2], m[1]] : [m[1], m[2], m[3]];
    return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
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

/** GET /api/finance/summary */
financeRouter.get('/summary', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { period = '6', from, to } = req.query;

    let startDate: string;
    let endDate: string = new Date().toISOString().slice(0, 10);

    if (from && typeof from === 'string' && to && typeof to === 'string') {
      startDate = from;
      endDate = to;
    } else {
      const months = Math.min(12, Math.max(1, parseInt(period as string, 10) || 6));
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      startDate = cutoff.toISOString().slice(0, 10);
    }

    const revenueRows = db.prepare(`
      SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
      FROM finance_entries WHERE type = 'revenue' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 1
    `).all(startDate, endDate) as any[];

    const expenseRows = db.prepare(`
      SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
      FROM finance_entries WHERE type = 'expense' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 1
    `).all(startDate, endDate) as any[];

    const categoryRows = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM finance_entries WHERE type = 'expense' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 2 DESC
    `).all(startDate, endDate) as any[];

    const byMonth: Record<string, { month: string; revenue: number; expense: number; result: number }> = {};
    revenueRows.forEach((r: any) => {
      if (!byMonth[r.month]) byMonth[r.month] = { month: r.month, revenue: 0, expense: 0, result: 0 };
      byMonth[r.month].revenue = r.total || 0;
    });
    expenseRows.forEach((r: any) => {
      if (!byMonth[r.month]) byMonth[r.month] = { month: r.month, revenue: 0, expense: 0, result: 0 };
      byMonth[r.month].expense = r.total || 0;
    });
    Object.keys(byMonth).forEach(m => {
      byMonth[m].result = byMonth[m].revenue - byMonth[m].expense;
    });

    const monthly = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
    const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0);
    const totalExpense = monthly.reduce((s, r) => s + r.expense, 0);
    const resultTotal = totalRevenue - totalExpense;
    const avgProfit = monthly.length > 0 ? resultTotal / monthly.length : 0;
    const projectedAnnualProfit = avgProfit * 12;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const current = monthly.find(m => m.month === currentMonth) || { revenue: 0, expense: 0, result: 0 };

    return res.json({
      kpis: {
        revenueMonth: current.revenue,
        expenseMonth: current.expense,
        resultMonth: current.result,
        revenueTotal: totalRevenue,
        expenseTotal: totalExpense,
        resultTotal,
        projectedAnnualProfit
      },
      categories: categoryRows.map(c => ({
        name: c.category,
        value: c.total || 0
      })),
      monthly,
      periodInfo: { start: startDate, end: endDate },
    });
  } catch (err) {
    console.error('Finance summary error:', err);
    return res.status(500).json({ error: 'Erro ao carregar resumo financeiro.' });
  }
});

/** GET /api/finance/entries */
financeRouter.get('/entries', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { type, from, to } = req.query;
    let sql = 'SELECT * FROM finance_entries WHERE 1=1';
    const params: string[] = [];

    if (type === 'revenue' || type === 'expense') {
      sql += ` AND type = ?`;
      params.push(type);
    }
    if (from && typeof from === 'string') {
      sql += ` AND entry_date >= ?`;
      params.push(from);
    }
    if (to && typeof to === 'string') {
      sql += ` AND entry_date <= ?`;
      params.push(to);
    }
    sql += ' ORDER BY entry_date DESC, created_at DESC LIMIT 100';

    const rows = db.prepare(sql).all(...params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar lançamentos.' });
  }
});

/** POST /api/finance/entries */
financeRouter.post('/entries', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { type, category, amount, entry_date, description } = req.body;
    if (!type || !category || amount == null || !entry_date) {
      return res.status(400).json({ error: 'Campos obrigatórios: type, category, amount, entry_date.' });
    }
    const value = Math.abs(parseFloat(amount));

    db.prepare(`
      INSERT INTO finance_entries (type, category, amount, entry_date, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(type, category, value, entry_date, description || null);

    saveSqlite();
    const row = db.prepare('SELECT * FROM finance_entries ORDER BY rowid DESC LIMIT 1').get();
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar lançamento.' });
  }
});

/** DELETE /api/finance/entries/:id */
financeRouter.delete('/entries/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const r = db.prepare('DELETE FROM finance_entries WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'Lançamento não encontrado.' });
    saveSqlite();
    return res.json({ message: 'Lançamento removido.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover lançamento.' });
  }
});

/** POST /api/finance/import */
financeRouter.post('/import', upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const file = req.file as Express.Multer.File | undefined;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ error: 'Arquivo CSV vázio ou ausente.' });
    }
    const { headers, rows: csvRows } = parseCsvToRows(file.buffer);
    const idx = (key: string) => headers.indexOf(key);
    const typeCol = idx('type');
    const categoryCol = idx('category');
    const amountCol = idx('amount');
    const dateCol = idx('entry_date');
    const descCol = idx('description');

    if (typeCol < 0 || categoryCol < 0 || amountCol < 0 || dateCol < 0) {
      return res.status(400).json({ error: 'Cabeçalhos do CSV inválidos.' });
    }

    let imported = 0;
    const errors: any[] = [];

    const insertStmt = db.prepare(
      `INSERT INTO finance_entries (type, category, amount, entry_date, description) VALUES (?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const type = normalizeType(row[typeCol]);
      const cat = (row[categoryCol] || '').trim();
      const amt = parseAmount(row[amountCol]);
      const dat = normalizeDate(row[dateCol]);
      const ds = descCol >= 0 && descCol < row.length ? (row[descCol] || '').trim() || null : null;

      if (!type || !cat || amt == null || !dat) {
        errors.push({ row: i + 2, message: 'Dados inválidos.' });
        continue;
      }

      try {
        insertStmt.run(type, cat, amt, dat, ds);
        imported++;
      } catch (e) {
        errors.push({ row: i + 2, message: 'Erro no banco.' });
      }
    }

    saveSqlite();
    return res.json({ imported, total: csvRows.length, errors: errors.length ? errors : undefined });
  } catch (err) {
    return res.status(500).json({ error: 'Erro na importação.' });
  }
});
