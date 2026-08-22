import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCHEMA = join(__dirname, '../prisma/schema/integrations.prisma');
const MIGRATION = join(
  __dirname,
  '../prisma/migrations/20260823120000_ats_call_intent/migration.sql',
);

describe('AtsCallIntent schema constraint', () => {
  it('uniques the scoped idempotency key per actor', () => {
    const schema = readFileSync(SCHEMA, 'utf8');
    expect(schema).toContain('model AtsCallIntent');
    expect(schema).toContain('@@unique([employeeId, idempotencyKey])');
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toContain('CREATE UNIQUE INDEX "ats_call_intents_employee_id_idempotency_key_key"');
    expect(sql).toContain('"employee_id"');
    expect(sql).toContain('"idempotency_key"');
  });
});
