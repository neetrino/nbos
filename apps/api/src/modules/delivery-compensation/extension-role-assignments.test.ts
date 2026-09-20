import { describe, expect, it } from 'vitest';
import {
  parseExtensionRoleAssignments,
  serializeExtensionRoleAssignments,
} from './extension-role-assignments';

describe('parseExtensionRoleAssignments', () => {
  it('accepts a role holder and treats blank as cleared', () => {
    expect(
      parseExtensionRoleAssignments([
        { roleKey: 'BACKEND', employeeId: 'emp-1' },
        { roleKey: 'QA', employeeId: '  ' },
        { roleKey: 'PM', employeeId: null },
      ]),
    ).toEqual([
      { roleKey: 'BACKEND', employeeId: 'emp-1' },
      { roleKey: 'QA', employeeId: null },
      { roleKey: 'PM', employeeId: null },
    ]);
  });

  it('rejects an empty payload, an unknown role and a repeated role', () => {
    expect(() => parseExtensionRoleAssignments([])).toThrow(/assignments is required/);
    expect(() =>
      parseExtensionRoleAssignments([{ roleKey: 'ARCHITECT', employeeId: 'emp-1' }]),
    ).toThrow(/roleKey ARCHITECT is invalid/);
    expect(() =>
      parseExtensionRoleAssignments([
        { roleKey: 'QA', employeeId: 'emp-1' },
        { roleKey: 'QA', employeeId: 'emp-2' },
      ]),
    ).toThrow(/duplicate roleKey QA/);
  });
});

describe('serializeExtensionRoleAssignments', () => {
  it('returns all six roles with unassigned ones as null', () => {
    const rows = serializeExtensionRoleAssignments([
      { roleKey: 'QA', employeeId: 'emp-9', employee: { firstName: 'Ani', lastName: 'Sargsyan' } },
    ]);

    expect(rows).toHaveLength(6);
    expect(rows.find((row) => row.roleKey === 'QA')).toEqual({
      roleKey: 'QA',
      employeeId: 'emp-9',
      employeeName: 'Ani Sargsyan',
    });
    expect(rows.find((row) => row.roleKey === 'BACKEND')).toEqual({
      roleKey: 'BACKEND',
      employeeId: null,
      employeeName: null,
    });
  });
});
