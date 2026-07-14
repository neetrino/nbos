import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ProductDoneReadiness } from '@/lib/api/products';
import { cn } from '@/lib/utils';

interface ProductDoneReadinessPanelProps {
  readiness: ProductDoneReadiness | undefined;
  compact?: boolean;
}

export function ProductDoneReadinessPanel({
  readiness,
  compact = false,
}: ProductDoneReadinessPanelProps) {
  if (!readiness) return null;

  const isReady = readiness.canCompleteWithRuntimeData;
  const sections = [
    { title: 'Blockers', items: readiness.blockers, tone: 'blocker' as const },
    { title: 'Warnings', items: readiness.warnings, tone: 'warning' as const },
    {
      title: 'Missing runtime signals',
      items: readiness.missingRuntimeSignals,
      tone: 'info' as const,
    },
  ].filter((section) => section.items.length > 0);

  return (
    <div
      className={cn(
        'bg-card border-border rounded-xl border',
        compact ? 'px-3.5 py-3' : 'mt-4 p-3',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            isReady ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600',
          )}
        >
          {isReady ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <AlertTriangle className="size-4" aria-hidden />
          )}
        </div>
        <p className="text-sm font-semibold">Done readiness</p>
      </div>
      {!compact ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Runtime checks use current delivery, finance and documentation data.
        </p>
      ) : null}
      {sections.map((section, index) => (
        <ReadinessIssueList
          key={section.title}
          title={section.title}
          items={section.items}
          tone={section.tone}
          bordered={index > 0}
        />
      ))}
    </div>
  );
}

function ReadinessIssueList({
  title,
  items,
  tone,
  bordered,
}: {
  title: string;
  items: ProductDoneReadiness['blockers'];
  tone: 'blocker' | 'warning' | 'info';
  bordered: boolean;
}) {
  return (
    <div className={cn('mt-2.5', bordered && 'border-border border-t pt-2.5')}>
      <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        {title}
      </p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.code} className="flex items-start gap-1.5 text-xs">
            <span className={getToneClass(tone)}>
              <IssueIcon tone={tone} />
            </span>
            <span className="text-foreground/80">
              <span className={cn('font-medium', getToneClass(tone))}>{item.label}:</span>{' '}
              {item.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IssueIcon({ tone }: { tone: 'blocker' | 'warning' | 'info' }) {
  if (tone === 'blocker') {
    return <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current" aria-hidden />;
  }
  if (tone === 'info') {
    return <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />;
  }
  return <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />;
}

function getToneClass(tone: 'blocker' | 'warning' | 'info') {
  if (tone === 'blocker') return 'text-red-700 dark:text-red-300';
  if (tone === 'warning') return 'text-amber-700 dark:text-amber-300';
  return 'text-sky-700 dark:text-sky-300';
}
