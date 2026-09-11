import { describe, expect, it } from 'vitest';
import type { EmployeeGeneralDraft } from './employee-general-form-state';
import {
  buildEmployeeOwnProfilePatch,
  canEditHrEmployeeFields,
  canEditOwnAccountFields,
  isEmployeeOwnProfileDirty,
} from './employee-own-profile-fields';

function draft(partial: Partial<EmployeeGeneralDraft> = {}): EmployeeGeneralDraft {
  return {
    firstName: 'Anna',
    lastName: 'Petrosyan',
    email: 'anna@neetrino.com',
    phone: '+374',
    telegram: '@anna',
    sipId: '1001',
    position: 'Developer',
    level: 'MIDDLE',
    notes: '',
    hireDate: '2024-01-01',
    birthday: '1994-03-12',
    status: 'ACTIVE',
    roleId: 'role-1',
    ...partial,
  };
}

describe('employee-own-profile-fields', () => {
  it('allows self-edit on an active own account only', () => {
    expect(canEditOwnAccountFields(true, 'ACTIVE')).toBe(true);
    expect(canEditOwnAccountFields(true, 'TERMINATED')).toBe(false);
    expect(canEditOwnAccountFields(false, 'ACTIVE')).toBe(false);
  });

  it('keeps HR fields behind COMPANY edit', () => {
    expect(canEditHrEmployeeFields(true, 'ACTIVE')).toBe(true);
    expect(canEditHrEmployeeFields(false, 'ACTIVE')).toBe(false);
  });

  it('builds a personal patch and ignores HR-only changes', () => {
    const snap = draft();
    const next = draft({
      phone: '+37499111',
      email: 'changed@neetrino.com',
      roleId: 'role-2',
      hireDate: '2025-01-01',
    });
    expect(buildEmployeeOwnProfilePatch(snap, next)).toEqual({ phone: '+37499111' });
    expect(isEmployeeOwnProfileDirty(next, snap)).toBe(true);
    expect(isEmployeeOwnProfileDirty(snap, snap)).toBe(false);
  });
});
