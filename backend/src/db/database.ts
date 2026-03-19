import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prontuario';

export const pool = new Pool({
  connectionString,
  // Max number of clients in the pool
  max: 20,
  // How long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // How long to wait before timing out when connecting a new client
  connectionTimeoutMillis: 2000,
});

export const getDb = () => pool;

export async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('🐘 PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL', err);
    throw err;
  }
}
