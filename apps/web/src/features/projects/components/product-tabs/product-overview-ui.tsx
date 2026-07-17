import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
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

/** Soft icon well tones — same family as product overview StatChip. */
export type OverviewMetaIconTone =
  | 'blue'
  | 'purple'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'slate';

const OVERVIEW_META_ICON_TONE_CLASS: Record<OverviewMetaIconTone, string> = {
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

export function OverviewMetaTile({
  label,
  value,
  icon: Icon,
  iconTone = 'slate',
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  iconTone?: OverviewMetaIconTone;
  className?: string;
}) {
  return (
    <div className={cn('bg-muted/35 flex items-center gap-2.5 rounded-lg px-3 py-2', className)}>
      {Icon ? (
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            OVERVIEW_META_ICON_TONE_CLASS[iconTone],
          )}
        >
          <Icon size={14} aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <dt className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          {label}
        </dt>
        <dd className="text-foreground mt-1 min-w-0 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
