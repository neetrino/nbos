import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260921180000_sale_amount_per_unit/migration.sql'),
  'utf8',
);

describe('sale amount per unit migration', () => {
  it('replaces the multiplier with an AMD-per-unit rate and the 10 000 default', () => {
    expect(sql).toContain('ADD COLUMN "amount_per_unit" DECIMAL(14,4)');
    expect(sql).toContain(
      'ADD COLUMN "default_sale_amount_per_unit" DECIMAL(14,4) NOT NULL DEFAULT 10000',
    );
    expect(sql).toContain('SET "amount_per_unit" = "multiplier" * 1000');
    expect(sql).toContain('SET "default_sale_amount_per_unit" = "default_sale_multiplier" * 1000');
  });

  it('drops the old multiplier and fixed-amount columns', () => {
    expect(sql).toContain('DROP COLUMN "multiplier"');
    expect(sql).toContain('DROP COLUMN "fixed_amount"');
    expect(sql).toContain('DROP COLUMN "default_sale_multiplier"');
  });
});
