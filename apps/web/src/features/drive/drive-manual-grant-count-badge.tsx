'use client';

import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function normalizeManualGrantCount(count: number | string | undefined | null): number {
  const n = typeof count === 'number' ? count : Number(count);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function driveManualGrantCountLabel(count: number): string {
  if (count === 1) return 'Shared with 1 person';
  return `Shared with ${count} people`;
}

/** Pill badge for list/table rows. */
export function DriveManualGrantCountBadge({
  count,
  className,
}: {
  count: number | string | undefined | null;
  className?: string;
}) {
  const n = normalizeManualGrantCount(count);
  if (n < 1) return null;

  return (
    <span
      className={cn(
        'border-primary/35 bg-background text-foreground inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm',
        className,
      )}
      title={driveManualGrantCountLabel(n)}
    >
      <Users className="text-primary size-3.5 shrink-0" aria-hidden />
      <span>{n}</span>
      <span className="sr-only">{driveManualGrantCountLabel(n)}</span>
    </span>
  );
}

/** Google-style shared marker on folder/file icon (count in corner). */
export function DriveSharedAccessIconOverlay({
  count,
  children,
  className,
}: {
  count: number | string | undefined | null;
  children: ReactNode;
  className?: string;
}) {
  const n = normalizeManualGrantCount(count);
  if (n < 1) return <>{children}</>;

  const countLabel = n > 99 ? '99+' : String(n);

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {children}
      <span
        className="bg-primary text-primary-foreground ring-background absolute -right-1 -bottom-1 flex min-w-[1.125rem] items-center justify-center rounded-full px-0.5 py-px text-[9px] leading-none font-bold shadow-sm ring-2"
        title={driveManualGrantCountLabel(n)}
        aria-hidden
      >
        {countLabel}
      </span>
      <span className="sr-only">{driveManualGrantCountLabel(n)}</span>
    </span>
  );
}
