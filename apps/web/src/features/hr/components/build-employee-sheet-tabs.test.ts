import { describe, expect, it } from 'vitest';
import { buildEmployeeSheetTabValues } from './build-employee-sheet-tabs';

describe('buildEmployeeSheetTabValues', () => {
  it('adds Security on My Account and keeps HR lifecycle tabs off for an active self profile', () => {
    expect(
      buildEmployeeSheetTabValues({
        selfProfile: true,
        status: 'ACTIVE',
        hasOnboardingChecklist: false,
      }),
    ).toEqual(['general', 'departments', 'security']);
  });

  it('adds Security for a platform owner viewing another employee', () => {
    expect(
      buildEmployeeSheetTabValues({
        selfProfile: false,
        status: 'ACTIVE',
        hasOnboardingChecklist: false,
        canManageEmployeeSecurity: true,
      }),
    ).toEqual(['general', 'departments', 'security']);
  });

  it('keeps Security hidden for a non-owner viewing another employee', () => {
    expect(
      buildEmployeeSheetTabValues({
        selfProfile: false,
        status: 'ACTIVE',
        hasOnboardingChecklist: false,
        canManageEmployeeSecurity: false,
      }),
    ).toEqual(['general', 'departments']);
  });
});
