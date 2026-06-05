import type { ProjectTeamRole } from './constants';

/** Platform roles that may manage any project team without a project seat. */
export const GLOBAL_PROJECT_TEAM_MANAGER_ROLE_SLUGS = ['owner', 'ceo'] as const;

export interface ProjectTeamManagementActor {
  roleSlug: string;
  /** Actor's seat on the project team, if any. */
  projectTeamRole?: ProjectTeamRole | null;
}

export function isGlobalProjectTeamManager(roleSlug: string): boolean {
  const key = roleSlug.trim().toLowerCase();
  return (GLOBAL_PROJECT_TEAM_MANAGER_ROLE_SLUGS as readonly string[]).includes(key);
}

/** Add/remove participants and change roles (incl. promote to Admin). */
export function canManageProjectTeam(actor: ProjectTeamManagementActor): boolean {
  if (isGlobalProjectTeamManager(actor.roleSlug)) return true;
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
