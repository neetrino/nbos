import { describe, expect, it } from 'vitest';
import { evaluateIsPlatformOwner, isFounderProtectedEmployee } from './evaluate-platform-owner';

const FOUNDER_ID = '14b22deb-5998-4bb5-aabe-f3ad5a0a6ff6';

describe('evaluateIsPlatformOwner', () => {
  it('does not treat another employee as Founder', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: 'other-employee',
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: FOUNDER_ID,
      }),
    ).toEqual({ ok: false, reason: 'id_mismatch' });
  });

  it('fails closed when env and database ownership diverge', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: FOUNDER_ID,
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    ).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('succeeds only when env, row, and active employee match', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: FOUNDER_ID,
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: FOUNDER_ID,
      }),
    ).toEqual({ ok: true, reason: 'ok' });
  });
});

describe('isFounderProtectedEmployee', () => {
  it('protects both env and database identities', () => {
    expect(isFounderProtectedEmployee(FOUNDER_ID, FOUNDER_ID, FOUNDER_ID)).toBe(true);
    expect(isFounderProtectedEmployee(FOUNDER_ID, 'other', FOUNDER_ID)).toBe(true);
    expect(isFounderProtectedEmployee('other', 'other', FOUNDER_ID)).toBe(true);
    expect(isFounderProtectedEmployee('random', 'other', FOUNDER_ID)).toBe(false);
  });
});
