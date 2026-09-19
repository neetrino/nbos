import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONS_ROLE_MATRIX } from './rbac-role-matrix-operations';
import { M, N, R, type MatrixRow } from './rbac-scopes';

const SEED = 'packages/database/prisma/seed-rbac.ts';
const NONE: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];

function readRepo(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
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

describe('delivery compensation default grants', () => {
  const seed = readRepo(SEED);

  it('keeps RULES closed for Finance, HR, PM and operations roles', () => {
    expect(roleModuleToken(seed, 'role-finance-director', 'DELIVERY_COMPENSATION_RULES')).toBe('N');
    expect(roleModuleToken(seed, 'role-pm', 'DELIVERY_COMPENSATION_RULES')).toBe('N');
    expect(roleModuleToken(seed, 'role-head-delivery', 'DELIVERY_COMPENSATION_RULES')).toBe('N');
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      expect(OPERATIONS_ROLE_MATRIX[roleId]?.DELIVERY_COMPENSATION_RULES ?? NONE).toEqual(N);
    }
  });

  it('gives PM and Head of Delivery catalog manage without delete', () => {
    expect(roleModuleToken(seed, 'role-pm', 'FUNCTION_CATALOG')).toBe('M');
    expect(roleModuleToken(seed, 'role-head-delivery', 'FUNCTION_CATALOG')).toBe('M');
    expect(M[3]).toBe('NONE');
  });

  it('gives delivery team catalog read only', () => {
    expect(seed).toMatch(/const DEVELOPER_ROLE_MATRIX[\s\S]*FUNCTION_CATALOG:\s*R/);
    expect(roleModuleToken(seed, 'role-designer', 'FUNCTION_CATALOG')).toBe('R');
    expect(roleModuleToken(seed, 'role-qa', 'FUNCTION_CATALOG')).toBe('R');
    expect(R[1]).toBe('NONE');
  });

  it('does not grant catalog or rules to Finance or HR', () => {
    expect(roleModuleToken(seed, 'role-finance-director', 'FUNCTION_CATALOG')).toBe('N');
    expect(OPERATIONS_ROLE_MATRIX['role-hr-manager']?.FUNCTION_CATALOG).toEqual(N);
    expect(OPERATIONS_ROLE_MATRIX['role-accountant']?.FUNCTION_CATALOG).toEqual(N);
  });

  it('registers both modules for Owner/CEO full grants', () => {
    expect(seed).toMatch(/'FUNCTION_CATALOG'/);
    expect(seed).toMatch(/'DELIVERY_COMPENSATION_RULES'/);
    expect(seed).toMatch(/'role-owner': Object\.fromEntries\(MODULES\.map\(\(m\) => \[m, F\]\)\)/);
  });
});
