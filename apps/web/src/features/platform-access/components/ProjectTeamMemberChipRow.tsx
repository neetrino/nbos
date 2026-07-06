'use client';

import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
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
  onRemove: (employeeId: string) => void;
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
    <RelationPickerChip
      label={name}
      labelAddon={
        <TeamMemberEmployeeStatusBadge
          status={row.employee.status}
          className="shrink-0 px-1.5 py-0 text-[10px]"
        />
      }
      subtitle={row.employee.email}
      entityKind="employee"
      disabled={disabled}
      onOpen={() => void relations.openEntity('employee', row.employeeId)}
      trailing={
        <ProjectTeamRoleControl
          role={row.role as 'ADMIN' | 'MEMBER'}
          disabled={disabled}
          canManageTeam={canManageTeam}
          canAssignAdmin={canAssignAdmin}
          onRoleChange={(role) => onRoleChange(row.employeeId, role)}
        />
      }
      onClear={canManageTeam && !disabled ? () => void onRemove(row.employeeId) : undefined}
    />
  );
}
