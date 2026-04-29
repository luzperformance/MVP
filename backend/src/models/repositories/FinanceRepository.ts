import { getDb, saveSqlite } from './Database';
import { FinanceEntity } from '../entities/Finance';

export class FinanceRepository {
  db = getDb();

  async getSummaryData(startDate: string, endDate: string): Promise<any> {
    const revenueRows = this.db.prepare(`
      SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
      FROM finance_entries WHERE type = 'revenue' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 1
    `).all(startDate, endDate) as any[];

    const expenseRows = this.db.prepare(`
      SELECT strftime('%Y-%m', entry_date) as month, SUM(amount) as total
      FROM finance_entries WHERE type = 'expense' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 1
    `).all(startDate, endDate) as any[];

    const categoryRows = this.db.prepare(`
      SELECT category, SUM(amount) as total
      FROM finance_entries WHERE type = 'expense' AND entry_date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY 2 DESC
    `).all(startDate, endDate) as any[];

    return { revenueRows, expenseRows, categoryRows };
  }

  async findWithFilters(filters: { type?: string; from?: string; to?: string }): Promise<FinanceEntity[]> {
    const { type, from, to } = filters;
    let sql = 'SELECT * FROM finance_entries WHERE 1=1';
    const params: string[] = [];

    if (type === 'revenue' || type === 'expense') {
      sql += ` AND type = ?`;
      params.push(type);
    }
    if (from) {
      sql += ` AND entry_date >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND entry_date <= ?`;
      params.push(to);
    }
    sql += ' ORDER BY entry_date DESC, created_at DESC LIMIT 100';

    return this.db.prepare(sql).all(...params) as FinanceEntity[];
  }

  async create(data: Partial<FinanceEntity>): Promise<FinanceEntity> {
    const { type, category, amount, entry_date, description } = data;
    this.db.prepare(`
      INSERT INTO finance_entries (type, category, amount, entry_date, description)
      VALUES (?, ?, ?)
    `).run(type, category, amount, entry_date, description || null);

    saveSqlite();
    return this.db.prepare('SELECT * FROM finance_entries ORDER BY id DESC LIMIT 1').get() as FinanceEntity;
  }

  async delete(id: string): Promise<number> {
    const r = this.db.prepare('DELETE FROM finance_entries WHERE id = ?').run(id);
    if (r.changes > 0) saveSqlite();
    return r.changes;
  }

  async bulkCreate(entries: any[]): Promise<number> {
    const insertStmt = this.db.prepare(
      `INSERT INTO finance_entries (type, category, amount, entry_date, description) VALUES (?, ?, ?, ?, ?)`
    );
    let count = 0;
    const transaction = this.db.transaction((data: any[]) => {
      for (const entry of data) {
        insertStmt.run(entry.type, entry.category, entry.amount, entry.entry_date, entry.description);
        count++;
      }
    });
    transaction(entries);
    saveSqlite();
    return count;
  }
}
