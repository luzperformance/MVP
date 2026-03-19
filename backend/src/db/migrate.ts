import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import 'dotenv/config';

// Temporary installation of better-sqlite3 for migration if removed
// In a real scenario, we'd run this before uninstalling or use a separate script.
// Since I uninstalled it, I'll assume the user might need to re-install it for this tool to run.

const sqliteDbPath = path.resolve(__dirname, '../data/prontuario.db');
const pgConnectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prontuario';

async function migrate() {
  const sqlite = new Database(sqliteDbPath);
  const pgPool = new Pool({ connectionString: pgConnectionString });
  
  console.log('🚀 Starting Migration...');

  try {
    // 1. Migrate Doctors
    const doctors = sqlite.prepare('SELECT * FROM doctor').all();
    for (const d of doctors) {
      await pgPool.query(
        'INSERT INTO doctor (email, password_hash, name, crm, specialty, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
        [d.email, d.password_hash, d.name, d.crm, d.specialty, d.created_at]
      );
    }
    console.log(`✅ Migrated ${doctors.length} doctors`);

    // 2. Migrate Patients (with Hybrid JSONB mapping)
    const patients = sqlite.prepare('SELECT * FROM patients').all();
    for (const p of patients) {
      const mgmt_data = {
        status: p.mgmt_status || 'ativo',
        origin: p.origin,
        first_consultation: p.first_consultation,
        last_consultation: p.last_consultation,
        uses_ea: !!p.uses_ea,
        wants_children: !!p.wants_children,
        address: p.address,
        cep: p.cep,
        city: p.city,
        state: p.state,
        insurance_name: p.insurance_name,
        package_type: p.package_type,
        monthly_value: p.monthly_value
      };

      await pgPool.query(
        'INSERT INTO patients (id, name, birth_date, phone, email, gender, mgmt_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [p.id, p.name, p.birth_date, p.phone, p.email, p.gender, JSON.stringify(mgmt_data), p.created_at, p.updated_at]
      );
    }
    console.log(`✅ Migrated ${patients.length} patients`);

    // 3. Migrate BI Layouts
    const layouts = sqlite.prepare('SELECT * FROM patient_bi_layouts').all();
    for (const l of layouts) {
      await pgPool.query(
        'INSERT INTO patient_bi_layouts (patient_id, doctor_id, layout_data, created_at) VALUES ($1, $2, $3, $4)',
        [l.patient_id, l.doctor_id, l.layout_data, l.created_at]
      );
    }
    console.log(`✅ Migrated ${layouts.length} BI layouts`);

    console.log('🎉 Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Failed:', err);
  } finally {
    sqlite.close();
    await pgPool.end();
  }
}

migrate();
