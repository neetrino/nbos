'use client';

import type { ReactNode } from 'react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import type { DepartmentMember } from '@/lib/api/employees';
import { cn } from '@/lib/utils';
import {
  ORG_PERSON_AVATAR_WRAP_CLASS,
  ORG_PERSON_NAME_CLASS,
  ORG_PERSON_ROW_CLASS,
} from './org-chart-constants';

export function orgChartMemberLabel(member: DepartmentMember): string {
  return `${member.employee.firstName} ${member.employee.lastName}`.trim();
}

export function orgChartMemberTitle(member: DepartmentMember): string {
  return member.employee.position?.trim() || member.employee.role?.name || '';
}

export function OrgChartPersonRow({
  member,
  compact = false,
  showTitle = true,
  trailing,
  onOpen,
}: {
  member: DepartmentMember;
  compact?: boolean;
  showTitle?: boolean;
  trailing?: ReactNode;
  onOpen?: (employeeId: string) => void;
}) {
  const label = orgChartMemberLabel(member);
  const title = showTitle ? orgChartMemberTitle(member) : '';
  return (
    <button
      type="button"
      title={label}
      className={ORG_PERSON_ROW_CLASS}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.(member.employeeId);
      }}
    >
      <span className={ORG_PERSON_AVATAR_WRAP_CLASS}>
        <EmployeePersonAvatar
          label={label}
          imageUrl={member.employee.avatar}
          className={compact ? 'size-6 text-[10px]' : 'size-8'}
        />
      </span>
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className={ORG_PERSON_NAME_CLASS}>{label}</span>
        {title ? (
          <span
            className={cn(
              'text-muted-foreground block truncate',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            {title}
          </span>
        ) : null}
      </span>
      {trailing}
    </button>
  );
}

export function OrgChartAvatarStack({ members }: { members: DepartmentMember[] }) {
  return (
    <div className="flex -space-x-1.5">
      {members.slice(0, 3).map((member) => (
        <EmployeePersonAvatar
          key={member.id}
          label={orgChartMemberLabel(member)}
          imageUrl={member.employee.avatar}
          className="ring-background size-6 text-[10px] ring-2"
        />
      ))}
    </div>
  );
}
