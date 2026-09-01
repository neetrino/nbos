import { describe, expect, it } from 'vitest';
import { buildEmployeeSheetTabs } from './build-employee-sheet-tabs';

describe('buildEmployeeSheetTabs', () => {
  it('adds Security on My Account and keeps HR lifecycle tabs off for an active self profile', () => {
    expect(
      buildEmployeeSheetTabs({
        selfProfile: true,
        status: 'ACTIVE',
        hasOnboardingChecklist: false,
      }).map((tab) => tab.value),
    ).toEqual(['general', 'departments', 'security']);
  });
});
