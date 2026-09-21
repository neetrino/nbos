import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'migrations/20260919120000_delivery_compensation_v2_foundation/migration.sql',
);

describe('delivery compensation v2 foundation migration', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('is additive and does not rewrite bonus amounts or Sales sources', () => {
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    expect(sql).toContain('ADD COLUMN "delivery_source"');
    expect(sql).toContain('ADD COLUMN "delivery_allocation_id"');
    expect(statements).not.toMatch(/UPDATE\s+"bonus_entries"/i);
    expect(statements).not.toMatch(/LeadSourceEnum/);
    expect(statements).not.toMatch(/\bNETWORK\b/);
    expect(statements).not.toMatch(/sales_bonus_policies/);
  });

  it('keeps units nullable and enrollment disabled', () => {
    expect(sql).toContain('"units" DECIMAL(14, 4)');
    expect(sql).not.toMatch(/"units" DECIMAL\(14, 4\) NOT NULL/);
    expect(sql).toContain("'default', false");
    expect(sql).toContain('delivery_function_price_versions_one_published');
    expect(sql).toContain('bonus_entries_delivery_allocation_id_key');
    expect(sql).toContain('delivery_configurations_owner_xor_chk');
  });
});
