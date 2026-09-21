import { describe, expect, it } from 'vitest';
import { summarizeRoleUnits } from './summarize-role-units';

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
