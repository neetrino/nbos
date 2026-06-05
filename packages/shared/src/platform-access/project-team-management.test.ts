import { describe, expect, it } from 'vitest';
import {
  canAssignProjectTeamAdminRole,
  canManageProjectTeam,
  isGlobalProjectTeamManager,
  resolveActorProjectTeamRole,
} from './project-team-management';

describe('project-team-management', () => {
  it('recognizes global managers', () => {
    expect(isGlobalProjectTeamManager('owner')).toBe(true);
    expect(isGlobalProjectTeamManager('CEO')).toBe(true);
    expect(isGlobalProjectTeamManager('pm')).toBe(false);
  });

  it('allows project admins to manage team', () => {
    expect(canManageProjectTeam({ roleSlug: 'pm', projectTeamRole: 'ADMIN' })).toBe(true);
    expect(canAssignProjectTeamAdminRole({ roleSlug: 'pm', projectTeamRole: 'ADMIN' })).toBe(true);
  });

  it('denies project members without global role', () => {
    expect(canManageProjectTeam({ roleSlug: 'pm', projectTeamRole: 'MEMBER' })).toBe(false);
    expect(
      canAssignProjectTeamAdminRole({ roleSlug: 'developer', projectTeamRole: 'MEMBER' }),
    ).toBe(false);
  });

  it('resolves actor project role from roster', () => {
    const members = [
      { employeeId: 'a', role: 'ADMIN' },
      { employeeId: 'b', role: 'MEMBER' },
    ];
    expect(resolveActorProjectTeamRole(members, 'a')).toBe('ADMIN');
    expect(resolveActorProjectTeamRole(members, 'b')).toBe('MEMBER');
    expect(resolveActorProjectTeamRole(members, 'c')).toBeNull();
  });
});
