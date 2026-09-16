import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SCRIPT =
  'packages/database/scripts/upsert-finance-expense-plans-client-services-permissions.ts';

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('finance permission-split upsert script', () => {
  const source = readRepo(SCRIPT);

  it('creates missing role_permissions and never updates a configured scope', () => {
    expect(source).toContain('prisma.rolePermission.create');
    expect(source).toContain('if (existing) continue');
    expect(source).not.toContain('rolePermission.update');
    expect(source).not.toContain('rolePermission.upsert');
    expect(source).not.toMatch(/DO UPDATE/);
  });

  it('encodes the same default matrix as the migration', () => {
    expect(source).toContain("'role-owner'");
    expect(source).toContain("'role-ceo'");
    expect(source).toContain("'role-finance-director'");
    expect(source).toContain("'role-accountant'");
    expect(source).toContain("'role-tech-specialist'");
    expect(source).toContain("'role-operations-manager'");
    expect(source).not.toContain('role-head-sales');
    expect(source).toMatch(
      /'role-accountant': \{ FINANCE_EXPENSE_PLANS: F, FINANCE_CLIENT_SERVICES: N \}/,
    );
    expect(source).toMatch(
      /'role-tech-specialist': \{ FINANCE_EXPENSE_PLANS: L, FINANCE_CLIENT_SERVICES: N \}/,
    );
  });
});
