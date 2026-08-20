import { hasCompanyExecutiveOps } from '../platform-ownership/evaluate-platform-owner';
import type { ProjectTeamRole } from './constants';

export interface ProjectTeamManagementActor {
  roleSlug: string;
  isPlatformOwner?: boolean;
  /** Actor's seat on the project team, if any. */
  projectTeamRole?: ProjectTeamRole | null;
}

export function isGlobalProjectTeamManager(roleSlug: string, isPlatformOwner = false): boolean {
  return hasCompanyExecutiveOps({ isPlatformOwner, roleSlug });
}

/** Add/remove participants and change roles (incl. promote to Admin). */
export function canManageProjectTeam(actor: ProjectTeamManagementActor): boolean {
  if (isGlobalProjectTeamManager(actor.roleSlug, actor.isPlatformOwner === true)) return true;
  return actor.projectTeamRole === 'ADMIN';
}

/** Assign or keep the project Admin team role. */
export function canAssignProjectTeamAdminRole(actor: ProjectTeamManagementActor): boolean {
  return canManageProjectTeam(actor);
}

export function resolveActorProjectTeamRole(
  members: ReadonlyArray<{ employeeId: string; role: string }>,
  actorEmployeeId: string,
): ProjectTeamRole | null {
  const row = members.find((member) => member.employeeId === actorEmployeeId);
  if (row?.role === 'ADMIN' || row?.role === 'MEMBER') return row.role;
  return null;
}
