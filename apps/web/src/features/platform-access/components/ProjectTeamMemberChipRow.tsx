'use client';

import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { employeeAvatarSoftColor, employeeInitials } from '@/features/hr/utils/employee-display';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { cn } from '@/lib/utils';
import { ProjectTeamRoleControl } from './ProjectTeamRoleControl';
import { TeamMemberEmployeeStatusBadge } from './TeamMemberEmployeeStatusBadge';

const TEAM_MEMBER_CARD_CLASS =
  'border-border bg-card group/field flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3';

const TEAM_MEMBER_AVATAR_CLASS =
  'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold';

const TEAM_MEMBER_OPEN_BTN_CLASS =
  'outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-1';

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
  const initials = employeeInitials(row.employee);
  const avatarTone = employeeAvatarSoftColor(name);

  const openEmployee = () => {
    relations.openEntity('employee', row.employeeId, {
      onRemoveParticipant: canManageTeam ? () => onRemove(row.employeeId) : undefined,
    });
  };

  return (
    <article className={cn(TEAM_MEMBER_CARD_CLASS, disabled && 'opacity-60')}>
      <button
        type="button"
        disabled={disabled}
        onClick={openEmployee}
        className={cn(TEAM_MEMBER_OPEN_BTN_CLASS, 'shrink-0 rounded-full')}
        aria-label={`Open ${name}`}
      >
        <span className={cn(TEAM_MEMBER_AVATAR_CLASS, avatarTone)} aria-hidden>
          {initials}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={openEmployee}
          className={cn(TEAM_MEMBER_OPEN_BTN_CLASS, 'min-w-0 flex-1 rounded-md text-left')}
          aria-label={`Open ${name}`}
        >
          <span className="text-foreground block truncate text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
            {row.employee.email}
          </span>
        </button>

        <TeamMemberEmployeeStatusBadge
          status={row.employee.status}
          dot
          className="shrink-0 rounded-full px-2 py-0.5"
        />
      </div>

      <div
        className="flex shrink-0 items-center"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <ProjectTeamRoleControl
          role={row.role as 'ADMIN' | 'MEMBER'}
          disabled={disabled}
          canManageTeam={canManageTeam}
          canAssignAdmin={canAssignAdmin}
          onRoleChange={(role) => onRoleChange(row.employeeId, role)}
        />
      </div>
    </article>
  );
}
