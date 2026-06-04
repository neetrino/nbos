'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RELATION_PICKER_PERSON_AVATAR_CLASS } from '@/components/shared/detail-sheet-classes';

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

/** Person avatar with initials fallback (relation chips, pickers, task assignee). */
export function EmployeePersonAvatar({ label, className, imageUrl }: EmployeePersonAvatarProps) {
  const initials = initialsFromEmployeeLabel(label);
  const shellClass = cn(RELATION_PICKER_PERSON_AVATAR_CLASS, className);
  const trimmedImage = imageUrl?.trim();

  if (trimmedImage) {
    return (
      <Avatar className={cn(shellClass, 'overflow-hidden p-0')}>
        <AvatarImage src={trimmedImage} alt={label} />
        <AvatarFallback className="text-xs font-semibold uppercase">{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return <div className={shellClass}>{initials}</div>;
}
