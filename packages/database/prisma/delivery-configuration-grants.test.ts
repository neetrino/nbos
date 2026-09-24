import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONS_ROLE_MATRIX } from './rbac-role-matrix-operations';
import { M, N, R, VO, type MatrixRow } from './rbac-scopes';

const SEED = 'packages/database/prisma/seed-rbac.ts';
const MODULE = 'DELIVERY_CONFIGURATION';
const NONE: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];

function readRepo(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

/**
 * Most roles carry their matrix inline, but developers and the seller share a named one, so a
 * lookup keyed only on the role id would report their module as absent.
 */
function moduleToken(source: string, marker: string, module: string): string {
  const start = source.indexOf(marker);
  if (start < 0) return 'ABSENT_ROLE';
  const rest = source.slice(start + marker.length);
  const next = rest.search(/\n {2}'role-|\nconst /);
  const block = next === -1 ? rest : rest.slice(0, next);
  const match = block.match(new RegExp(`${module}:\\s*(VA_OWN|VA|F|L|N|R|D|M|VO|LA)\\b`));
  return match?.[1] ?? 'ABSENT_MODULE';
}

function roleModuleToken(source: string, roleId: string, module: string): string {
  const shared: Record<string, string> = {
    'role-developer': 'const DEVELOPER_ROLE_MATRIX',
    'role-developer-frontend': 'const DEVELOPER_ROLE_MATRIX',
    'role-seller': 'const SELLER_ROLE_MATRIX',
  };
  return moduleToken(source, shared[roleId] ?? `'${roleId}':`, module);
}

describe('delivery configuration default grants', () => {
  const seed = readRepo(SEED);

  it('is registered as a module, so Owner and CEO receive it with every other one', () => {
    expect(seed).toMatch(/'DELIVERY_CONFIGURATION',/);
  });

  it('gives the configurator to PM and Head of Delivery without delete', () => {
    expect(roleModuleToken(seed, 'role-pm', MODULE)).toBe('M');
    expect(roleModuleToken(seed, 'role-head-delivery', MODULE)).toBe('M');
    expect(M[1]).toBe('ALL');
    expect(M[3]).toBe('NONE');
  });

  /**
   * The whole point of the module: a delivery specialist keeps the read that `PROJECTS_VIEW = OWN`
   * already gave them and loses only the ability to change scope, roles and assignees.
   */
  it('leaves delivery specialists reading their own cards and editing none', () => {
    for (const roleId of [
      'role-developer',
      'role-junior-developer',
      'role-designer',
      'role-qa',
      'role-tech-specialist',
    ]) {
      expect(roleModuleToken(seed, roleId, MODULE)).toBe('VO');
    }
    expect(VO).toEqual(['OWN', 'NONE', 'NONE', 'NONE']);
  });

  it('keeps company-wide readers reading and nothing more', () => {
    expect(roleModuleToken(seed, 'role-finance-director', MODULE)).toBe('R');
    expect(OPERATIONS_ROLE_MATRIX['role-head-support']?.[MODULE]).toEqual(R);
    expect(OPERATIONS_ROLE_MATRIX['role-operations-manager']?.[MODULE]).toEqual(R);
    expect(R).toEqual(['ALL', 'NONE', 'NONE', 'NONE']);
  });

  it('stays closed for sales, marketing, HR, accounting and observers', () => {
    for (const roleId of [
      'role-seller',
      'role-head-sales',
      'role-marketing',
      'role-head-marketing',
      'role-observer',
    ]) {
      expect(roleModuleToken(seed, roleId, MODULE)).toBe('N');
    }
    expect(OPERATIONS_ROLE_MATRIX['role-hr-manager']?.[MODULE] ?? NONE).toEqual(N);
    expect(OPERATIONS_ROLE_MATRIX['role-accountant']?.[MODULE] ?? NONE).toEqual(N);
  });

  it('names every role explicitly rather than leaving the module absent', () => {
    for (const matrix of Object.values(OPERATIONS_ROLE_MATRIX)) {
      expect(matrix[MODULE]).toBeDefined();
    }
  });
});
