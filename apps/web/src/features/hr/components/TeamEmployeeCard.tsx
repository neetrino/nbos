'use client';

import { FileText, Mail, Phone } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { PERSON_CONTACT_AVATAR_CLASS } from '@/components/shared/person-contact-row.constants';
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';
import {
  employeeAvatarSoftColor,
  employeeFullName,
  employeeInitials,
} from '@/features/hr/utils/employee-display';
import type { Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

interface TeamEmployeeCardProps {
  employee: Employee;
  onOpen: (employee: Employee) => void;
}

/** Soft ambient elevation — matches clients directory profile cards. */
const TEAM_EMPLOYEE_CARD_CLASS = [
  'bg-card focus-visible:ring-ring group flex w-full flex-col items-center rounded-3xl p-5 text-center',
  'shadow-[0_12px_40px_rgb(15_15_20/0.08)] transition-[transform,box-shadow]',
  'duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)]',
  'hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgb(15_15_20/0.11)]',
  'focus-visible:ring-2 focus-visible:outline-none',
].join(' ');

export function TeamEmployeeCard({ employee, onOpen }: TeamEmployeeCardProps) {
  const name = employeeFullName(employee);
  const lvl = employee.level ? getEmployeeLevel(employee.level) : null;
  const st = getEmployeeStatus(employee.status);
  const roleLabel = employee.position || employee.role?.name || null;
  const avatarTone = employeeAvatarSoftColor(name);
  const hasMeta = Boolean(lvl || employee.email || employee.phone);

  return (
    <button type="button" onClick={() => onOpen(employee)} className={TEAM_EMPLOYEE_CARD_CLASS}>
      <div className="flex w-full flex-col items-center">
        <span
          className={cn(PERSON_CONTACT_AVATAR_CLASS, 'size-16 text-lg', avatarTone)}
          aria-hidden
        >
          {employeeInitials(employee)}
        </span>
        {st ? (
          <StatusBadge
            label={st.label}
            variant={st.variant}
            dot
            className="mt-3 self-center rounded-full px-2.5 py-0.5 text-xs"
          />
        ) : null}
        <h3 className="text-foreground mt-3 max-w-full truncate text-base font-bold tracking-tight">
          {name}
        </h3>
        {roleLabel ? (
          <p className="text-muted-foreground mt-1 max-w-full truncate text-sm">{roleLabel}</p>
        ) : null}
      </div>

      {hasMeta ? (
        <div className="border-border mt-5 w-full space-y-2.5 border-t pt-4 text-left">
          {lvl ? (
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={14} className="text-muted-foreground shrink-0" aria-hidden />
              <StatusBadge
                label={lvl.label}
                variant={lvl.variant}
                className="rounded-full px-2.5 py-0.5 text-xs"
              />
            </div>
          ) : null}
          {employee.email ? (
            <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
              <Mail size={14} className="shrink-0" aria-hidden />
              <span className="truncate">{employee.email}</span>
            </div>
          ) : null}
          {employee.phone ? (
            <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
              <Phone size={14} className="shrink-0" aria-hidden />
              <span className="truncate">{employee.phone}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
