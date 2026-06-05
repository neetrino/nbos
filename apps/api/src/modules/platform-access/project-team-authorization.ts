import { ForbiddenException } from '@nestjs/common';
import {
  canAssignProjectTeamAdminRole,
  canManageProjectTeam,
  type ProjectTeamRole,
} from '@nbos/shared';
import type { ProjectTeamRoleEnum } from '@nbos/database';

export function mapProjectTeamRoleEnum(
  role: ProjectTeamRoleEnum | null | undefined,
): ProjectTeamRole | null {
  if (role === 'ADMIN' || role === 'MEMBER') return role;
  return null;
}

export function assertCanManageProjectTeam(
  actorRoleSlug: string,
  actorProjectTeamRole: ProjectTeamRoleEnum | null,
): void {
  if (
    canManageProjectTeam({
      roleSlug: actorRoleSlug,
      projectTeamRole: mapProjectTeamRoleEnum(actorProjectTeamRole),
    })
  ) {
    return;
  }
  throw new ForbiddenException(
    'Only Owner, CEO, or project admins can manage project participants.',
  );
}

export function assertCanAssignProjectTeamAdmin(
  actorRoleSlug: string,
  actorProjectTeamRole: ProjectTeamRoleEnum | null,
): void {
  if (
    canAssignProjectTeamAdminRole({
      roleSlug: actorRoleSlug,
      projectTeamRole: mapProjectTeamRoleEnum(actorProjectTeamRole),
    })
  ) {
    return;
  }
  throw new ForbiddenException('Only Owner, CEO, or project admins can assign the Admin role.');
}
