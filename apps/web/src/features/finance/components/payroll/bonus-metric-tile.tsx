'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BonusMetricTone = 'default' | 'paid' | 'muted';

const TONE_SURFACE: Record<BonusMetricTone, string> = {
  default: 'border-border bg-card',
  paid: 'border-emerald-200/80 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30',
  muted: 'border-border bg-muted/20',
};

export function BonusMetricTile({
  icon: Icon,
  iconShellClassName,
  label,
  value,
  tone = 'default',
  title,
}: {
  icon: LucideIcon;
  iconShellClassName: string;
  label: string;
  value: string;
  tone?: BonusMetricTone;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-xl border px-2.5 py-2.5 shadow-sm',
        TONE_SURFACE[tone],
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full',
            iconShellClassName,
          )}
        >
          <Icon size={12} aria-hidden />
        </span>
        <p className="text-muted-foreground truncate text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
      </div>
      <p className="text-foreground truncate text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
