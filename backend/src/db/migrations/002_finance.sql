-- 002_finance.sql — Lançamentos financeiros da clínica (receitas e despesas)

CREATE TABLE IF NOT EXISTS finance_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('revenue', 'expense')),
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_type ON finance_entries(type);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_finance_category ON finance_entries(category);
