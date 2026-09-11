import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  /** Compact count tiles vs emphasized money tile. */
  size?: 'default' | 'compact' | 'emphasis';
  className?: string;
}

export function KpiCard({ label, value, hint, icon, size = 'default', className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-2xl border',
        size === 'compact' && 'p-3.5',
        size === 'default' && 'p-4',
        size === 'emphasis' && 'p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p
            className={cn(
              'text-foreground mt-2 font-semibold tabular-nums',
              size === 'compact' && 'text-xl',
              size === 'default' && 'text-2xl',
              size === 'emphasis' && 'text-xl',
            )}
          >
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              'bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-xl',
              size === 'compact' && 'size-8',
              size === 'default' && 'size-9',
              size === 'emphasis' && 'size-10',
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="text-muted-foreground mt-2 text-sm">{hint}</p> : null}
    </div>
  );
}
