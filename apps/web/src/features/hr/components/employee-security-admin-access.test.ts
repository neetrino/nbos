import { describe, expect, it } from 'vitest';
import { canManageEmployeeSecurity } from './employee-security-admin-access';

const owner = { selfProfile: false, actorId: 'owner', actorIsPlatformOwner: true };

describe('canManageEmployeeSecurity', () => {
  it('allows the platform owner on another active employee', () => {
    expect(
      canManageEmployeeSecurity({ ...owner, employeeId: 'e1', employeeStatus: 'ACTIVE' }),
    ).toBe(true);
  });

  it('hides the actions on the owner own record opened through Team', () => {
    expect(
      canManageEmployeeSecurity({ ...owner, employeeId: 'owner', employeeStatus: 'ACTIVE' }),
    ).toBe(false);
  });

  it('hides the actions on the My Account sheet', () => {
    expect(
      canManageEmployeeSecurity({
        ...owner,
        selfProfile: true,
        employeeId: 'e1',
        employeeStatus: 'ACTIVE',
      }),
    ).toBe(false);
  });

  it('hides the actions for a non-owner', () => {
    expect(
      canManageEmployeeSecurity({
        selfProfile: false,
        actorId: 'hr-manager',
        actorIsPlatformOwner: false,
        employeeId: 'e1',
        employeeStatus: 'ACTIVE',
      }),
    ).toBe(false);
  });

  it('hides the actions before the current employee is known', () => {
    expect(
      canManageEmployeeSecurity({
        selfProfile: false,
        actorIsPlatformOwner: true,
        employeeId: 'e1',
        employeeStatus: 'ACTIVE',
      }),
    ).toBe(false);
  });

  it('hides the actions on a terminated employee', () => {
    expect(
      canManageEmployeeSecurity({ ...owner, employeeId: 'e1', employeeStatus: 'TERMINATED' }),
    ).toBe(false);
  });
});
