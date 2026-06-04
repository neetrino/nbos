'use client';

import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS } from '@/components/shared/detail-sheet-classes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate, usePermission } from '@/lib/permissions';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { projectTeamRoleShortLabel } from '../team-member-labels';

interface ProjectTeamMemberChipRowProps {
  row: ProjectTeamMemberRow;
  disabled?: boolean;
  onRoleChange: (employeeId: string, role: 'ADMIN' | 'MEMBER') => void;
  onRemove: (employeeId: string) => void;
}

export function ProjectTeamMemberChipRow({
  row,
  disabled,
  onRoleChange,
  onRemove,
}: ProjectTeamMemberChipRowProps) {
  const relations = useEntityRelations();
  const { can } = usePermission();
  const canEdit = can('EDIT', 'PROJECTS');
  const name = `${row.employee.firstName} ${row.employee.lastName}`.trim();
  const subtitle = row.employee.email;

  const roleSelect = (
    <PermissionGate
      module="PROJECTS"
      action="EDIT"
      fallback={
        <Badge variant="secondary" className="text-[10px] uppercase">
          {projectTeamRoleShortLabel(row.role)}
        </Badge>
      }
    >
      <Select
        value={row.role}
        disabled={disabled}
        onValueChange={(value) => {
          if (value === 'ADMIN' || value === 'MEMBER') {
            onRoleChange(row.employeeId, value);
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn(RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS, 'tracking-normal normal-case')}
          aria-label={`Role for ${name}`}
        >
          <SelectValue>{projectTeamRoleShortLabel(row.role)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MEMBER">Member</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
    </PermissionGate>
  );

  return (
    <RelationPickerChip
      label={name}
      subtitle={subtitle}
      entityKind="employee"
      disabled={disabled}
      onOpen={() => void relations.openEntity('employee', row.employeeId)}
      trailing={roleSelect}
      onClear={canEdit && !disabled ? () => void onRemove(row.employeeId) : undefined}
    />
  );
}
