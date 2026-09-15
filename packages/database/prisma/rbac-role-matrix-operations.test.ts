import { describe, expect, it } from 'vitest';
import { OPERATIONS_ROLE_MATRIX } from './rbac-role-matrix-operations';
import type { MatrixRow, Scope } from './rbac-scopes';

const NONE_ROW: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];

/** A module missing from a matrix receives no grant, which is the same as NONE. */
function row(roleId: string, module: string): MatrixRow {
  return OPERATIONS_ROLE_MATRIX[roleId]?.[module] ?? NONE_ROW;
}

function scopes(roleId: string, module: string): Scope[] {
  return [...row(roleId, module)];
}

describe('operations role matrices', () => {
  it('defines exactly the four roles the migration creates', () => {
    expect(Object.keys(OPERATIONS_ROLE_MATRIX).sort()).toEqual([
      'role-accountant',
      'role-head-support',
      'role-hr-manager',
      'role-operations-manager',
    ]);
  });

  it('keeps payroll away from HR — compensation belongs to Finance', () => {
    expect(scopes('role-hr-manager', 'FINANCE_SALARY')).toEqual(NONE_ROW);
    expect(scopes('role-hr-manager', 'FINANCE_BONUSES')).toEqual(NONE_ROW);
  });

  it('lets HR and Operations manage the company without deleting it', () => {
    for (const roleId of ['role-hr-manager', 'role-operations-manager']) {
      const [view, edit, add, remove] = row(roleId, 'COMPANY');
      expect([view, edit, add]).toEqual(['ALL', 'ALL', 'ALL']);
      expect(remove).toBe('NONE');
    }
  });

  it('closes platform administration for every one of them', () => {
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      for (const module of ['SETTINGS', 'SETTINGS_RBAC', 'SETTINGS_SCHEDULER']) {
        expect(scopes(roleId, module)).toEqual(NONE_ROW);
      }
    }
  });

  it('gives Head of Support the tickets but leaves the project with Delivery', () => {
    expect(scopes('role-head-support', 'SUPPORT_TICKETS')).toEqual(['ALL', 'ALL', 'ALL', 'ALL']);
    expect(scopes('role-head-support', 'PROJECTS')).toEqual(['ALL', 'NONE', 'NONE', 'NONE']);
  });

  it('lets the accountant execute finance but only read compensation', () => {
    for (const module of ['FINANCE_INVOICES', 'FINANCE_PAYMENTS', 'FINANCE_EXPENSES']) {
      expect(scopes('role-accountant', module)).toEqual(['ALL', 'ALL', 'ALL', 'ALL']);
    }
    for (const module of ['FINANCE_SALARY', 'FINANCE_BONUSES']) {
      expect(scopes('role-accountant', module)).toEqual(['ALL', 'NONE', 'NONE', 'NONE']);
    }
    expect(scopes('role-accountant', 'AUDIT_LOGS')).toEqual(NONE_ROW);
    expect(scopes('role-accountant', 'COMPANY')).toEqual(['ALL', 'NONE', 'NONE', 'NONE']);
  });

  it('keeps SOP authoring explicit for Operations instead of inheriting it', () => {
    expect(scopes('role-operations-manager', 'CHECKLIST_TEMPLATES')).toEqual([
      'ALL',
      'ALL',
      'ALL',
      'ALL',
    ]);
  });

  it('keeps CRM closed for all four', () => {
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      expect(scopes(roleId, 'CRM_LEADS')).toEqual(NONE_ROW);
      expect(scopes(roleId, 'CRM_DEALS')).toEqual(NONE_ROW);
    }
  });

  it('keeps the Calls journal closed until granted in Settings', () => {
    for (const roleId of Object.keys(OPERATIONS_ROLE_MATRIX)) {
      expect(scopes(roleId, 'CALLS')).toEqual(NONE_ROW);
    }
  });
});
