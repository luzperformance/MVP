-- Migration 009: Add google_tokens to doctor table
-- Run: sqlite3 data/prontuario.db < this_file.sql
ALTER TABLE doctor ADD COLUMN google_tokens TEXT DEFAULT NULL;
