'use client';

import { useMemo } from 'react';
import {
  canAssignProjectTeamAdminRole,
  canManageProjectTeam,
  resolveActorProjectTeamRole,
} from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';

export function useProjectTeamManagementAccess(members: ProjectTeamMemberRow[]) {
  const { me } = usePermission();

  return useMemo(() => {
    if (!me) {
      return { canManageTeam: false, canAssignAdmin: false };
    }

    const actor = {
      roleSlug: me.role.slug,
      projectTeamRole: resolveActorProjectTeamRole(members, me.id),
    };

    return {
      canManageTeam: canManageProjectTeam(actor),
      canAssignAdmin: canAssignProjectTeamAdminRole(actor),
    };
  }, [me, members]);
}
