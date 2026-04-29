import { FinanceRepository } from '../repositories/FinanceRepository';

export class FinanceService {
  constructor(private financeRepo: FinanceRepository) {}

  async getSummary(period: string = '6', from?: string, to?: string) {
    let startDate: string;
    let endDate: string = new Date().toISOString().slice(0, 10);

    if (from && to) {
      startDate = from;
      endDate = to;
    } else {
      const months = Math.min(12, Math.max(1, parseInt(period, 10) || 6));
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      startDate = cutoff.toISOString().slice(0, 10);
    }

    const { revenueRows, expenseRows, categoryRows } = await this.financeRepo.getSummaryData(startDate, endDate);

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

    return {
      kpis: {
        revenueMonth: current.revenue,
        expenseMonth: current.expense,
        resultMonth: current.result,
        revenueTotal: totalRevenue,
        expenseTotal: totalExpense,
        resultTotal,
        projectedAnnualProfit
      },
      categories: categoryRows.map((c: any) => ({
        name: c.category,
        value: c.total || 0
      })),
      monthly,
      periodInfo: { start: startDate, end: endDate },
    };
  }

  async getEntries(filters: { type?: string; from?: string; to?: string }) {
    return this.financeRepo.findWithFilters(filters);
  }

  async createEntry(data: any) {
    const value = Math.abs(parseFloat(data.amount));
    return this.financeRepo.create({ ...data, amount: value });
  }

  async deleteEntry(id: string) {
    return this.financeRepo.delete(id);
  }

  async importCsv(buffer: Buffer) {
    // CSV logic from finance.ts moved here
    const { headers, rows } = this.parseCsvToRows(buffer);
    const idx = (key: string) => headers.indexOf(key);
    const typeCol = idx('type');
    const categoryCol = idx('category');
    const amountCol = idx('amount');
    const dateCol = idx('entry_date');
    const descCol = idx('description');

    if (typeCol < 0 || categoryCol < 0 || amountCol < 0 || dateCol < 0) {
      throw new Error('Cabeçalhos do CSV inválidos.');
    }

    const validEntries = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const type = this.normalizeType(row[typeCol]);
      const cat = (row[categoryCol] || '').trim();
      const amt = this.parseAmount(row[amountCol]);
      const dat = this.normalizeDate(row[dateCol]);
      const ds = descCol >= 0 && descCol < row.length ? (row[descCol] || '').trim() || null : null;

      if (!type || !cat || amt == null || !dat) {
        errors.push({ row: i + 2, message: 'Dados inválidos.' });
        continue;
      }
      validEntries.push({ type, category: cat, amount: amt, entry_date: dat, description: ds });
    }

    const importedCount = await this.financeRepo.bulkCreate(validEntries);
    return { imported: importedCount, total: rows.length, errors: errors.length ? errors : undefined };
  }

  private parseCsvToRows(csvBuffer: Buffer): { headers: string[]; rows: string[][] } {
    const text = csvBuffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = this.parseCsvLine(lines[0]).map(h => this.HEADER_MAP[h.toLowerCase().trim()] || h.toLowerCase().trim());
    const rows = lines.slice(1).map(l => this.parseCsvLine(l));
    return { headers, rows };
  }

  private parseCsvLine(line: string): string[] {
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

  private HEADER_MAP: Record<string, string> = {
    tipo: 'type', type: 'type',
    categoria: 'category', category: 'category',
    valor: 'amount', amount: 'amount', value: 'amount',
    data: 'entry_date', entry_date: 'entry_date', date: 'entry_date',
    descricao: 'description', description: 'description',
  };

  private normalizeType(v: string): 'revenue' | 'expense' | null {
    const s = (v || '').toLowerCase().trim();
    if (['receita', 'revenue', 'r'].includes(s)) return 'revenue';
    if (['despesa', 'expense', 'd', 'despesas'].includes(s)) return 'expense';
    return null;
  }

  private normalizeDate(v: string): string | null {
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

  private parseAmount(v: string): number | null {
    const s = (v || '').trim().replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}
