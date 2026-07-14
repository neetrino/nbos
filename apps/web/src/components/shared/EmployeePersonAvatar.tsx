'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PERSON_PICKER_AVATAR_CLASS } from '@/components/shared/person-contact-row.constants';
import { employeeAvatarSoftColor } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';

export function initialsFromEmployeeLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]!;
  const b = last[0] ?? '';
  return `${a}${b}`.toUpperCase();
}

type EmployeePersonAvatarProps = {
  label: string;
  className?: string;
  imageUrl?: string;
};

/**
 * Person avatar with soft pastel initials (Projects Contacts language).
 * Used by relation chips (Creator / Assignee / …) and directory rows.
 */
export function EmployeePersonAvatar({ label, className, imageUrl }: EmployeePersonAvatarProps) {
  const initials = initialsFromEmployeeLabel(label);
  const tone = employeeAvatarSoftColor(label);
  const shellClass = cn(PERSON_PICKER_AVATAR_CLASS, tone, className);
  const trimmedImage = imageUrl?.trim();

  if (trimmedImage) {
    return (
      <Avatar className={cn(shellClass, 'overflow-hidden p-0')}>
        <AvatarImage src={trimmedImage} alt={label} />
        <AvatarFallback className={cn('text-xs font-semibold uppercase', tone)}>
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return <div className={shellClass}>{initials}</div>;
}
