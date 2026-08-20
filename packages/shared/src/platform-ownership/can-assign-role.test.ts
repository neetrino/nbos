import { describe, expect, it } from 'vitest';
import { canAssignRole, isRoleVisibleInAssignmentPicker } from './can-assign-role';

describe('canAssignRole', () => {
  it('never assigns the legacy Owner role', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: true,
        actorRoleSlug: 'ceo',
        targetRoleSlug: 'owner',
        targetRoleAssignable: false,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
  });

  it('blocks Finance from assigning Founder or CEO', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: false,
        actorRoleSlug: 'finance-director',
        targetRoleSlug: 'owner',
        targetRoleAssignable: false,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
    expect(
      canAssignRole({
        actorIsPlatformOwner: false,
        actorRoleSlug: 'finance-director',
        targetRoleSlug: 'ceo',
        targetRoleAssignable: true,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
  });

  it('blocks CEO from assigning CEO', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: false,
        actorRoleSlug: 'ceo',
        targetRoleSlug: 'ceo',
        targetRoleAssignable: true,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(false);
  });

  it('allows Founder to assign the first CEO only', () => {
    expect(
      canAssignRole({
        actorIsPlatformOwner: true,
        actorRoleSlug: 'pm',
        targetRoleSlug: 'ceo',
        targetRoleAssignable: true,
        ceoHeldByOtherEmployee: false,
      }).allowed,
    ).toBe(true);
    expect(
      canAssignRole({
        actorIsPlatformOwner: true,
        actorRoleSlug: 'pm',
        targetRoleSlug: 'ceo',
        targetRoleAssignable: true,
        ceoHeldByOtherEmployee: true,
      }).allowed,
    ).toBe(false);
  });
});

describe('isRoleVisibleInAssignmentPicker', () => {
  it('hides Owner and hides CEO unless the actor is Founder', () => {
    expect(
      isRoleVisibleInAssignmentPicker({
        roleSlug: 'owner',
        assignable: false,
        actorIsPlatformOwner: true,
      }),
    ).toBe(false);
    expect(
      isRoleVisibleInAssignmentPicker({
        roleSlug: 'ceo',
        assignable: true,
        actorIsPlatformOwner: false,
      }),
    ).toBe(false);
    expect(
      isRoleVisibleInAssignmentPicker({
        roleSlug: 'ceo',
        assignable: true,
        actorIsPlatformOwner: true,
      }),
    ).toBe(true);
  });
});
