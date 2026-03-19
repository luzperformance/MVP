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

    // 2. Migrate Patients (with Hybrid JSONB mapping & Optimizations)
    const patients = sqlite.prepare('SELECT * FROM patients').all();
    for (const p of patients) {
      // Mapping SQLite fields to a consolidated JSONB management object
      const mgmt_data = {
        status: p.mgmt_status || 'ativo',
        origin: p.origin,
        first_consultation: p.first_consultation,
        last_consultation: p.last_consultation,
        uses_ea: p.uses_ea === 1,
        wants_children: p.wants_children === 1,
        address: p.address,
        cep: p.cep,
        city: p.city,
        state: p.state,
        insurance_name: p.insurance_name,
        package_type: p.package_type,
        monthly_value: p.monthly_value,
        notes: p.observations || p.notes
      };

      await pgPool.query(
        `INSERT INTO patients (id, name, birth_date, phone, email, gender, mgmt_data, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.id, p.name, p.birth_date, p.phone, p.email, p.gender, JSON.stringify(mgmt_data), p.created_at, p.updated_at]
      );
    }
    console.log(`✅ Migrated ${patients.length} patients with optimized JSONB`);

    // 3. Migrate Records (with SOAP structure)
    const records = sqlite.prepare('SELECT * FROM records').all();
    for (const r of records) {
      const metadata = {
        raw_input: r.raw_input,
        source: r.source,
        notes: r.notes
      };

      await pgPool.query(
        `INSERT INTO records (id, patient_id, type, source, soap_subjective, soap_objective, soap_assessment, soap_plan, metadata, consultation_date, duration_minutes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [r.id, r.patient_id, r.type, r.source, r.soap_subjective, r.soap_objective, r.soap_assessment, r.soap_plan, JSON.stringify(metadata), r.consultation_date, r.duration_minutes, r.created_at, r.updated_at]
      );
    }
    console.log(`✅ Migrated ${records.length} records`);

    console.log('🎉 Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Failed:', err);
  } finally {
    sqlite.close();
    await pgPool.end();
  }
}

migrate();
