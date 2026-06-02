'use client';

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

/** Miniature person avatar for relation chips (Delivery team pickers, manual access grants). */
export function EmployeePersonAvatar({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn(RELATION_PICKER_PERSON_AVATAR_CLASS, className)}>
      {initialsFromEmployeeLabel(label)}
    </div>
  );
}
