'use client';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS } from '@/components/shared';
import { cn } from '@/lib/utils';
import { projectTeamRoleShortLabel } from '../team-member-labels';

interface ProjectTeamRoleControlProps {
  role: 'ADMIN' | 'MEMBER';
  disabled?: boolean;
  canManageTeam: boolean;
  canAssignAdmin: boolean;
  onRoleChange: (role: 'ADMIN' | 'MEMBER') => void;
}

export function ProjectTeamRoleControl({
  role,
  disabled,
  canManageTeam,
  canAssignAdmin,
  onRoleChange,
}: ProjectTeamRoleControlProps) {
  if (!canManageTeam) {
    return (
      <Badge variant="secondary" className="text-[10px] uppercase">
        {projectTeamRoleShortLabel(role)}
      </Badge>
    );
  }

  return (
    <Select
      value={role}
      disabled={disabled}
      onValueChange={(value) => {
        if (value === 'ADMIN' || value === 'MEMBER') onRoleChange(value);
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn(RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS, 'tracking-normal normal-case')}
        aria-label="Project team role"
      >
        <SelectValue>{projectTeamRoleShortLabel(role)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">Member</SelectItem>
        {canAssignAdmin ? <SelectItem value="ADMIN">Admin</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
