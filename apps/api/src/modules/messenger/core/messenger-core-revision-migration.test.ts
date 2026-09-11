import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATION = path.join(
  process.cwd(),
  'packages/database/prisma/migrations/20260905120000_messenger_zone_revisions/migration.sql',
);

describe('Messenger revision migration SQL', () => {
  it('is additive, seeds counters, and stores no message bodies or secrets', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "messenger_zone_revision_counters"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "messenger_conversation_revisions"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "messenger_employee_conversation_revisions"/);
    expect(sql).toMatch(/messenger_conversation_revisions_zone_revision_idx/);
    expect(sql).toMatch(/messenger_employee_revisions_employee_zone_revision_idx/);
    expect(sql).toMatch(/INSERT INTO "messenger_zone_revision_counters"/);
    expect(sql).not.toMatch(/DROP TABLE/);
    expect(sql).not.toMatch(/DROP COLUMN/);
    expect(sql).not.toMatch(/body|preview|title|payload|secret/i);
  });
});
