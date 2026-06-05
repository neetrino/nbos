import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function OverviewPanel({
  title,
  hint,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('bg-card border-border overflow-hidden rounded-xl border', className)}>
      <div className="border-border bg-muted/20 flex items-baseline justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint ? (
          <p className="text-muted-foreground max-w-md truncate text-[11px]">{hint}</p>
        ) : null}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function OverviewMetaGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-2">{children}</dl>;
}

export function OverviewMetaTile({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-muted/35 rounded-lg px-3 py-2', className)}>
      <dt className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1 min-w-0 text-sm font-medium">{value}</dd>
    </div>
  );
}
