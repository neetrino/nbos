/**
 * Inserts invented AMD profiles for the September 2026 dev check.
 * Refuses every host except the dev Neon host. Does not update existing profiles.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const requireFromDb = createRequire(new URL('../package.json', import.meta.url));
const { Client } = requireFromDb('pg');

const DEV_HOST_PREFIX = 'ep-nameless-term';
const PAYROLL_MONTH = '2026-09';
const MONTH_START = '2026-09-01';
const MONTH_END = '2026-09-30';
const SYNTHETIC_NOTE = 'nbos:dev-synthetic:2026-09-28';
const DEFAULT_SALARY = '100000.00';
const CASH_EXAMPLE_SALARY = '300000.00';
const EMPTY_DRAFT_ID = '18342467-1271-4cf8-9de2-941e34b84968';

const databaseUrl = readDevDatabaseUrl();
const client = new Client({ connectionString: databaseUrl });

await client.connect();
try {
  const removedDraft = await removeEmptySeptemberDraft(client);
  const inserted = await insertMissingProfiles(client);
  console.log(JSON.stringify({ removedDraft, inserted }, null, 2));
} finally {
  await client.end();
}

function readDevDatabaseUrl() {
  const line = fs
    .readFileSync(new URL('../../../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .find((row) => row.startsWith('DATABASE_URL='));
  if (!line) {
    throw new Error('DATABASE_URL is missing');
  }
  const url = line.slice('DATABASE_URL='.length).replace(/^"|"$/g, '');
  const host = new URL(url).hostname;
  if (!host.startsWith(DEV_HOST_PREFIX)) {
    throw new Error('refusing non-dev database host');
  }
  return url;
}

async function removeEmptySeptemberDraft(db) {
  const run = await db.query(
    `SELECT id, status FROM payroll_runs WHERE id = $1 AND payroll_month = $2`,
    [EMPTY_DRAFT_ID, PAYROLL_MONTH],
  );
  const row = run.rows[0];
  if (!row || row.status !== 'DRAFT') {
    return false;
  }
  const lines = await db.query(
    `SELECT count(*)::int AS n FROM salary_lines WHERE payroll_run_id = $1`,
    [EMPTY_DRAFT_ID],
  );
  if (lines.rows[0].n !== 0) {
    return false;
  }
  await db.query(`DELETE FROM payroll_runs WHERE id = $1 AND status = 'DRAFT'`, [EMPTY_DRAFT_ID]);
  return true;
}

async function insertMissingProfiles(db) {
  const missing = await db.query(
    `SELECT e.id, e.status, e.fire_date
     FROM employees e
     WHERE NOT EXISTS (
       SELECT 1 FROM compensation_profiles p
       WHERE p.employee_id = e.id
         AND p.status IN ('ACTIVE', 'ARCHIVED')
         AND p.effective_from <= $2::date
         AND (p.effective_to IS NULL OR p.effective_to >= $1::date)
     )
     ORDER BY e.id ASC`,
    [MONTH_START, MONTH_END],
  );
  const eligible = missing.rows.filter((row) => needsSeptemberProfile(row));
  const cashExampleId = eligible[0]?.id ?? null;
  const inserted = [];
  for (const row of eligible) {
    const salary = row.id === cashExampleId ? CASH_EXAMPLE_SALARY : DEFAULT_SALARY;
    await db.query(
      `INSERT INTO compensation_profiles (
         id, employee_id, base_salary, currency, effective_from, status, source, notes, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, $2, 'AMD', $3::date, 'ACTIVE', 'dev-synthetic', $4, now(), now()
       )`,
      [row.id, salary, MONTH_START, SYNTHETIC_NOTE],
    );
    inserted.push({ employeeId: row.id, salary });
  }
  return inserted;
}

function needsSeptemberProfile(row) {
  if (row.status !== 'TERMINATED') {
    return true;
  }
  if (row.fire_date == null) {
    return false;
  }
  return String(row.fire_date).slice(0, 10) >= MONTH_START;
}
