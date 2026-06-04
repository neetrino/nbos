'use client';

import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { ProjectTeamRoleControl } from './ProjectTeamRoleControl';

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
