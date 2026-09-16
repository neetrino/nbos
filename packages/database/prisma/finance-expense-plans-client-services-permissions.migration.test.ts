import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MIGRATION =
  'packages/database/prisma/migrations/20260916180000_finance_expense_plans_client_services_permissions/migration.sql';

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function rolePermissionInserts(sql: string): string[] {
  return [
    ...sql.matchAll(
      /INSERT INTO "role_permissions"[\s\S]*?ON CONFLICT \("role_id", "permission_id"\) DO NOTHING;/g,
    ),
  ].map((match) => match[0]);
}

describe('finance permission-split migration', () => {
  const sql = readRepo(MIGRATION);
  const inserts = rolePermissionInserts(sql);

  it('adds role_permissions only when missing and never overwrites a scope', () => {
    expect(inserts).toHaveLength(2);
    expect(sql).not.toMatch(/DO UPDATE/i);
    for (const insert of inserts) {
      expect(insert).toMatch(/ON CONFLICT \("role_id", "permission_id"\) DO NOTHING;/);
    }
  });

  it('grants expense plans ALL to finance roles and OWN VIEW/EDIT to delivery support', () => {
    const plans = inserts[0] ?? '';
    expect(plans).toContain("'FINANCE_EXPENSE_PLANS'");
    expect(plans).toContain("'role-owner'");
    expect(plans).toContain("'role-ceo'");
    expect(plans).toContain("'role-finance-director'");
    expect(plans).toContain("'role-accountant'");
    expect(plans).toContain("'role-tech-specialist'");
    expect(plans).toContain("'role-operations-manager'");
    expect(plans).toMatch(/THEN 'OWN'/);
    expect(plans).toMatch(/ELSE 'ALL'/);
    expect(plans).toMatch(/p\."action" IN \('VIEW', 'EDIT'\)/);
    expect(plans).not.toContain('role-head-sales');
  });

  it('grants client services only to Owner, CEO and Finance Director', () => {
    const services = inserts[1] ?? '';
    expect(services).toContain("'FINANCE_CLIENT_SERVICES'");
    expect(services).toContain("'role-owner'");
    expect(services).toContain("'role-ceo'");
    expect(services).toContain("'role-finance-director'");
    expect(services).not.toContain('role-accountant');
    expect(services).not.toContain('role-head-sales');
    expect(services).toContain("'ALL'");
  });
});
