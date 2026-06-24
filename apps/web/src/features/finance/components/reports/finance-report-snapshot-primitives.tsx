import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const REPORT_SNAPSHOT_METRIC_GRID = 'grid grid-cols-2 gap-3';

export function ReportSnapshot({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-foreground text-lg font-semibold">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          CASH basis
        </span>
      </div>
      <div className="mt-5 flex-1">{children}</div>
    </article>
  );
}

export function SnapshotMetric({
  icon: Icon,
  iconShellClass = 'bg-muted/45 text-muted-foreground',
  label,
  value,
  fullWidth = false,
}: {
  icon: LucideIcon;
  iconShellClass?: string;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        'border-border/70 flex items-center gap-3 rounded-xl border bg-white px-3 py-3 dark:bg-white',
        fullWidth && 'col-span-2',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          iconShellClass,
        )}
      >
        <Icon size={16} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground mt-0.5 text-base leading-tight font-bold tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function formatReportPercent(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(2)}%`;
}
