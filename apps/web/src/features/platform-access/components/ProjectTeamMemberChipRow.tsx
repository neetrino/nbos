'use client';

import { PersonContactRow } from '@/components/shared/PersonContactRow';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { ProjectTeamRoleControl } from './ProjectTeamRoleControl';
import { TeamMemberEmployeeStatusBadge } from './TeamMemberEmployeeStatusBadge';

interface ProjectTeamMemberChipRowProps {
  row: ProjectTeamMemberRow;
  disabled?: boolean;
  canManageTeam: boolean;
  canAssignAdmin: boolean;
  onRoleChange: (employeeId: string, role: 'ADMIN' | 'MEMBER') => void;
  onRemove: (employeeId: string) => Promise<void>;
}

export function ProjectTeamMemberChipRow({
  row,
  disabled,
  canManageTeam,
  canAssignAdmin,
  onRoleChange,
  onRemove,
}: ProjectTeamMemberChipRowProps) {
  const relations = useEntityRelations();
  const name = `${row.employee.firstName} ${row.employee.lastName}`.trim();

  return (
    <PersonContactRow
      name={name}
      email={row.employee.email}
      imageUrl={row.employee.avatar}
      disabled={disabled}
      onOpen={() => {
        relations.openEntity('employee', row.employeeId, {
          onRemoveParticipant: canManageTeam ? () => onRemove(row.employeeId) : undefined,
        });
      }}
      trailing={
        <>
          <TeamMemberEmployeeStatusBadge
            status={row.employee.status}
            dot
            className="rounded-full px-2 py-0.5"
          />
          <ProjectTeamRoleControl
            role={row.role as 'ADMIN' | 'MEMBER'}
            disabled={disabled}
            canManageTeam={canManageTeam}
            canAssignAdmin={canAssignAdmin}
            badge
            onRoleChange={(role) => onRoleChange(row.employeeId, role)}
          />
        </>
      }
    />
  );
}
