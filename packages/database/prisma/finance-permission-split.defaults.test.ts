import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONS_ROLE_MATRIX } from './rbac-role-matrix-operations';
import { F, L, N, type MatrixRow } from './rbac-scopes';

const ROOT = process.cwd();
const SEED = 'packages/database/prisma/seed-rbac.ts';
const MIGRATION =
  'packages/database/prisma/migrations/20260916180000_finance_expense_plans_client_services_permissions/migration.sql';

const NONE: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function roleModuleToken(source: string, roleId: string, module: string): string {
  const marker = `'${roleId}':`;
  const start = source.indexOf(marker);
  if (start < 0) return 'ABSENT_ROLE';
  const rest = source.slice(start);
  const next = rest.slice(marker.length).search(/\n  'role-/);
  const block = next === -1 ? rest : rest.slice(0, marker.length + next);
  const match = block.match(new RegExp(`${module}:\\s*(VA_OWN|VA|F|L|N|R|D|M|VO|LA)\\b`));
  return match?.[1] ?? 'ABSENT_MODULE';
}

describe('finance permission-split default grants', () => {
  const seed = readRepo(SEED);
  const sql = readRepo(MIGRATION);

  it('gives Owner and CEO full ALL for both new modules via the module catalog', () => {
    expect(seed).toMatch(/'FINANCE_EXPENSE_PLANS'/);
    expect(seed).toMatch(/'FINANCE_CLIENT_SERVICES'/);
    expect(seed).toMatch(/'role-owner': Object\.fromEntries\(MODULES\.map\(\(m\) => \[m, F\]\)\)/);
    expect(seed).toMatch(/'role-ceo': Object\.fromEntries\(MODULES\.map\(\(m\) => \[m, F\]\)\)/);
  });

  it('mirrors FINANCE_EXPENSES onto plans in the operations matrix', () => {
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      expect(OPERATIONS_ROLE_MATRIX[roleId]?.FINANCE_EXPENSE_PLANS).toEqual(
        OPERATIONS_ROLE_MATRIX[roleId]?.FINANCE_EXPENSES ?? NONE,
      );
    }
    expect(OPERATIONS_ROLE_MATRIX['role-accountant']?.FINANCE_EXPENSE_PLANS).toEqual(F);
    expect(OPERATIONS_ROLE_MATRIX['role-operations-manager']?.FINANCE_EXPENSE_PLANS).toEqual(L);
  });

  it('keeps client services closed for operational roles', () => {
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      expect(OPERATIONS_ROLE_MATRIX[roleId]?.FINANCE_CLIENT_SERVICES).toEqual(N);
    }
  });

  it('matches seed tokens to the documented defaults', () => {
    expect(roleModuleToken(seed, 'role-finance-director', 'FINANCE_EXPENSE_PLANS')).toBe('F');
    expect(roleModuleToken(seed, 'role-finance-director', 'FINANCE_CLIENT_SERVICES')).toBe('F');
    expect(roleModuleToken(seed, 'role-tech-specialist', 'FINANCE_EXPENSE_PLANS')).toBe('L');
    expect(roleModuleToken(seed, 'role-tech-specialist', 'FINANCE_CLIENT_SERVICES')).toBe('N');
    expect(roleModuleToken(seed, 'role-head-sales', 'FINANCE_EXPENSE_PLANS')).toBe('N');
    expect(roleModuleToken(seed, 'role-head-sales', 'FINANCE_CLIENT_SERVICES')).toBe('N');
  });

  it('keeps Head of Sales out of the migration grants', () => {
    expect(sql).not.toContain('role-head-sales');
    expect(sql).not.toContain('head-sales');
  });
});
