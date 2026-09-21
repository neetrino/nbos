import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    'migrations/20260919123000_delivery_compensation_permissions/migration.sql',
  ),
  'utf8',
);

describe('delivery compensation permission migration', () => {
  it('inserts both modules and does not grant RULES to Finance or PM', () => {
    expect(sql).toContain("'FUNCTION_CATALOG'");
    expect(sql).toContain("'DELIVERY_COMPENSATION_RULES'");
    expect(sql).toContain('ON CONFLICT ("module", "action") DO NOTHING');
    expect(sql).toContain('ON CONFLICT ("role_id", "permission_id") DO NOTHING');
    expect(sql).not.toMatch(/role-finance-director/);
    expect(sql).not.toMatch(/FINANCE_BONUSES/);
    expect(sql).not.toMatch(/role-hr-manager/);
  });

  it('limits RULES grants to Owner and CEO', () => {
    const marker = 'WHERE p."module" = \'DELIVERY_COMPENSATION_RULES\'';
    const rulesGrant = sql.slice(sql.indexOf(marker));
    expect(rulesGrant).toContain('role-owner');
    expect(rulesGrant).toContain('role-ceo');
    expect(rulesGrant).not.toContain('role-finance-director');
    expect(rulesGrant).not.toContain('role-pm');
    expect(rulesGrant).not.toContain('role-head-delivery');
  });
});
