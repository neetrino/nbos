import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ProductDoneReadiness } from '@/lib/api/products';

interface ProductDoneReadinessPanelProps {
  readiness: ProductDoneReadiness | undefined;
}

export function ProductDoneReadinessPanel({ readiness }: ProductDoneReadinessPanelProps) {
  if (!readiness) return null;

  return (
    <div className="mt-4 rounded-xl border p-3">
      <div className="flex items-start gap-2">
        {readiness.canCompleteWithRuntimeData ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Done readiness</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Runtime checks use current delivery, finance and documentation data.
          </p>
          <ReadinessIssueList title="Blockers" items={readiness.blockers} tone="blocker" />
          <ReadinessIssueList title="Warnings" items={readiness.warnings} tone="warning" />
          <ReadinessIssueList
            title="Missing runtime signals"
            items={readiness.missingRuntimeSignals}
            tone="info"
          />
        </div>
      </div>
    </div>
  );
}

function ReadinessIssueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: ProductDoneReadiness['blockers'];
  tone: 'blocker' | 'warning' | 'info';
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.code} className={`flex items-start gap-1.5 text-xs ${getToneClass(tone)}`}>
            {tone === 'info' ? (
              <Info className="mt-0.5 size-3 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            )}
            <span>
              <span className="font-medium">{item.label}:</span> {item.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getToneClass(tone: 'blocker' | 'warning' | 'info') {
  if (tone === 'blocker') return 'text-red-700 dark:text-red-300';
  if (tone === 'warning') return 'text-amber-700 dark:text-amber-300';
  return 'text-sky-700 dark:text-sky-300';
}
