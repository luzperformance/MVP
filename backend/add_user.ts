import { pool } from './src/db/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function addUser() {
  const email = 'drluzardi93@gmail.com';
  const password = 'teste1';
  const name = 'Dr. Luzardi';
  const crm = '939393';

  console.log(`🚀 Adding user ${email}...`);

  try {
    const hash = await bcrypt.hash(password, 12);
    const now = new Date();
    const userId = uuidv4();

    // 1. Insert into doctor table (Legacy/General)
    await pool.query(
      'INSERT INTO doctor (email, password_hash, name, crm, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      [email, hash, name, crm, now]
    );
    console.log('✅ Added to doctor table');

    // 2. Insert into Better Auth "user" table
    await pool.query(
      'INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
      [userId, name, email, true, now, now]
    );
    console.log('✅ Added to Better Auth user table');

    // 3. Insert into Better Auth "account" table
    const accountId = uuidv4();
    await pool.query(
      'INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [accountId, email, 'email', userId, hash, now, now]
    );
    console.log('✅ Added to Better Auth account table');

    console.log('🎉 User added successfully!');
  } catch (err) {
    console.error('❌ Failed to add user:', err);
  } finally {
    await pool.end();
  }
}

addUser();
