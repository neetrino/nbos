import { describe, expect, it } from 'vitest';
import { canAssignRole, evaluateIsPlatformOwner, isFounderProtectedEmployee } from './index';

const FOUNDER_ID = '14b22deb-5998-4bb5-aabe-f3ad5a0a6ff6';

describe('platform owner security acceptance (domain)', () => {
  it('1. assigning the Owner role does not create Founder identity', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: 'role-owner-holder',
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: FOUNDER_ID,
      }).ok,
    ).toBe(false);
  });

  it('2. assigning the CEO role does not create Founder identity', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: 'ceo-employee',
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: FOUNDER_ID,
      }).ok,
    ).toBe(false);
  });

  it('3. a custom role cannot become Founder', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: 'custom-role-employee',
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: FOUNDER_ID,
      }).ok,
    ).toBe(false);
  });

  it('4. Finance cannot assign Founder', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: false,
        actorRoleSlug: 'finance-director',
        targetRoleSlug: 'owner',
        targetRoleAssignable: false,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
  });

  it('5. CEO cannot assign Founder', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: false,
        actorRoleSlug: 'ceo',
        targetRoleSlug: 'owner',
        targetRoleAssignable: false,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
  });

  it('6. Founder account is protected from ordinary targeting', () => {
    expect(isFounderProtectedEmployee(FOUNDER_ID, FOUNDER_ID, FOUNDER_ID)).toBe(true);
  });

  it('10. ownership mismatch fails closed', () => {
    expect(
      evaluateIsPlatformOwner({
        employeeId: FOUNDER_ID,
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: FOUNDER_ID,
        founderEmployeeIdEnv: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      }),
    ).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('13. after transfer the previous owner is not Founder', () => {
    const newOwner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(
      evaluateIsPlatformOwner({
        employeeId: FOUNDER_ID,
        employeeStatus: 'ACTIVE',
        ownerEmployeeId: newOwner,
        founderEmployeeIdEnv: FOUNDER_ID,
      }).ok,
    ).toBe(false);
  });
});
