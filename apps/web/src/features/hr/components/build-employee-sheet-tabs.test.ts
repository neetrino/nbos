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
});
