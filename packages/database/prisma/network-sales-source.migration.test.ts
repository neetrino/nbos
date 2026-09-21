import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));

describe('NETWORK sales source migrations', () => {
  const enumSql = readFileSync(
    join(root, 'migrations/20260919140000_lead_source_network_enum/migration.sql'),
    'utf8',
  );
  const policySql = readFileSync(
    join(root, 'migrations/20260919140100_network_sales_bonus_policies/migration.sql'),
    'utf8',
  );

  it('adds NETWORK on its own before policy inserts', () => {
    expect(enumSql).toContain("ADD VALUE IF NOT EXISTS 'NETWORK'");
    expect(enumSql).not.toMatch(/sales_bonus_policies/);
    expect(enumSql).not.toMatch(/UPDATE/i);
  });

  it('inserts only Network rates and never updates other sources', () => {
    expect(policySql).toContain("'NETWORK', 'CLASSIC', 4, 1");
    expect(policySql).toContain("'NETWORK', 'SUBSCRIPTION_FIRST_MONTH', 40, 10");
    expect(policySql).toContain("'NETWORK', 'SUBSCRIPTION_RECURRING', 0, 0");
    expect(policySql).toMatch(/WHERE NOT EXISTS/i);
    expect(policySql).not.toMatch(/UPDATE\s+"sales_bonus_policies"/i);
    expect(policySql).not.toMatch(/'CLIENT'/);
    expect(policySql).not.toMatch(/'SALES'/);
    expect(policySql).not.toMatch(/NETWORKING/);
  });
});
