import { describe, expect, it } from 'vitest';
import {
  formatRoleUnitDisplay,
  isConfiguredRoleUnit,
  summarizeRoleUnits,
} from './summarize-role-units';

describe('summarizeRoleUnits', () => {
  it('distinguishes not configured from explicit zero', () => {
    expect(
      summarizeRoleUnits([
        { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: null },
        { roleKey: 'QA', unitKind: 'REQUIRED', units: '0' },
        { roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null },
      ]),
    ).toBe('BACKEND:∅ · QA:0 · PM:—');
  });
});

describe('formatRoleUnitDisplay', () => {
  it('shows a dash when the role is missing, unused, or not configured', () => {
    expect(formatRoleUnitDisplay(undefined)).toBe('—');
    expect(formatRoleUnitDisplay({ roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null })).toBe(
      '—',
    );
    expect(formatRoleUnitDisplay({ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: null })).toBe(
      '—',
    );
  });

  it('keeps explicit zero and configured units', () => {
    expect(formatRoleUnitDisplay({ roleKey: 'QA', unitKind: 'REQUIRED', units: '0' })).toBe('0');
    expect(formatRoleUnitDisplay({ roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '28' })).toBe(
      '28',
    );
    expect(isConfiguredRoleUnit({ roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '28' })).toBe(
      true,
    );
    expect(isConfiguredRoleUnit({ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: null })).toBe(
      false,
    );
    expect(isConfiguredRoleUnit({ roleKey: 'PM', unitKind: 'OPTIONAL', units: '4' })).toBe(true);
    expect(isConfiguredRoleUnit({ roleKey: 'PM', unitKind: 'OPTIONAL', units: null })).toBe(false);
    expect(isConfiguredRoleUnit({ roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null })).toBe(
      false,
    );
  });
});
