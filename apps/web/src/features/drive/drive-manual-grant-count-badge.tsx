'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function driveManualGrantCountLabel(count: number): string {
  if (count === 1) return 'Shared with 1 person';
  return `Shared with ${count} people`;
}

export function DriveManualGrantCountBadge({
  count,
  className,
  compact,
}: {
  count: number | undefined | null;
  className?: string;
  /** Tighter chip for folder pills. */
  compact?: boolean;
}) {
  if (count == null || count < 1) return null;

  return (
    <span
      className={cn(
        'bg-primary/10 text-primary inline-flex shrink-0 items-center gap-0.5 rounded-full font-medium tabular-nums',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      title={driveManualGrantCountLabel(count)}
    >
      <Users className={compact ? 'size-2.5' : 'size-3'} aria-hidden />
      <span aria-hidden>{count}</span>
      <span className="sr-only">{driveManualGrantCountLabel(count)}</span>
    </span>
  );
}
