'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';

/** Compact avatar + name row for delivery team read-only rows. */
export function DeliveryTeamEmployeeChoiceDisplay({ label }: { label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <EmployeePersonAvatar
        label={label}
        className="bg-primary/12 text-primary size-9 rounded-full text-[11px]"
      />
      <span className="text-primary truncate text-sm leading-tight font-medium">{label}</span>
    </span>
  );
}
