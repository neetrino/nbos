'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EMPLOYEE_STATUSES } from '@/features/hr/constants/hr';

export interface TeamStatusChipsProps {
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
  counts: Record<string, number>;
  showTerminated: boolean;
  onToggleTerminated: () => void;
  terminatedCount: number;
}

export function TeamStatusChips({
  activeStatus,
  onStatusChange,
  counts,
  showTerminated,
  onToggleTerminated,
  terminatedCount,
}: TeamStatusChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={activeStatus === null ? 'default' : 'outline'}
        className={cn('h-7 rounded-full px-3 text-xs')}
        onClick={() => onStatusChange(null)}
      >
        All
      </Button>
      {EMPLOYEE_STATUSES.filter((s) => s.value !== 'TERMINATED').map((status) => {
        const active = activeStatus === status.value;
        const count = counts[status.value] ?? 0;
        return (
          <Button
            key={status.value}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            className={cn('h-7 rounded-full px-3 text-xs tabular-nums')}
            onClick={() => onStatusChange(active ? null : status.value)}
          >
            {status.label}
            {count > 0 ? ` · ${count}` : ''}
          </Button>
        );
      })}
      {terminatedCount > 0 && (
        <Button
          type="button"
          size="sm"
          variant={showTerminated ? 'default' : 'outline'}
          className={cn('h-7 rounded-full px-3 text-xs tabular-nums')}
          onClick={onToggleTerminated}
        >
          Terminated · {terminatedCount}
        </Button>
      )}
    </div>
  );
}
