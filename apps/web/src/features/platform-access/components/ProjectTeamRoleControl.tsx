'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RELATION_PICKER_CHIP_TRAILING_SELECT_IDLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { projectTeamRoleShortLabel } from '../team-member-labels';

/** Matches {@link StatusBadge} pill sizing used for employee Active status. */
const TEAM_ROLE_BADGE_CLASS = [
  'inline-flex w-fit items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
  'h-auto min-h-0 data-[size=sm]:h-auto data-[size=sm]:min-h-0 data-[size=sm]:rounded-full data-[size=sm]:px-2',
].join(' ');

interface ProjectTeamRoleControlProps {
  role: 'ADMIN' | 'MEMBER';
  disabled?: boolean;
  canManageTeam: boolean;
  canAssignAdmin: boolean;
  onRoleChange: (role: 'ADMIN' | 'MEMBER') => void;
  /** Pill sized like the Active status badge (About project team cards). */
  badge?: boolean;
}

export function ProjectTeamRoleControl({
  role,
  disabled,
  canManageTeam,
  canAssignAdmin,
  onRoleChange,
  badge = false,
}: ProjectTeamRoleControlProps) {
  const label = projectTeamRoleShortLabel(role);

  if (!canManageTeam) {
    return (
      <span
        className={cn(
          'text-foreground shrink-0 text-xs font-medium',
          badge && TEAM_ROLE_BADGE_CLASS,
        )}
      >
        {label}
      </span>
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
        className={cn(
          RELATION_PICKER_CHIP_TRAILING_SELECT_IDLE_CLASS,
          'tracking-normal normal-case',
          badge && [
            TEAM_ROLE_BADGE_CLASS,
            'text-foreground bg-transparent shadow-none',
            'hover:text-foreground hover:bg-transparent',
            'data-popup-open:text-foreground data-popup-open:bg-transparent',
            '[&_svg]:hidden',
          ],
        )}
        aria-label="Project team role"
      >
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">Member</SelectItem>
        {canAssignAdmin ? <SelectItem value="ADMIN">Admin</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
