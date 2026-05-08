import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { ACTIVE_DELIVERY_STAGES, DELIVERY_STAGE_LABELS } from './project-delivery-board-model';

interface DeliveryLifecycleStripProps {
  lifecycle: DeliveryLifecycleProjection | undefined;
}

export function DeliveryLifecycleStrip({ lifecycle }: DeliveryLifecycleStripProps) {
  const current = lifecycle?.stage;
  const terminal = Boolean(lifecycle?.isTerminal);
  const currentIndex = current ? ACTIVE_DELIVERY_STAGES.indexOf(current) : -1;

  return (
    <div
      className="bg-muted/20 border-border shrink-0 border-b px-5 py-2.5 sm:px-7"
      aria-label="Delivery stages"
    >
      <div className="flex flex-wrap items-center gap-2">
        {ACTIVE_DELIVERY_STAGES.map((stage, index) => {
          const isCurrent = !terminal && current === stage;
          const isPast = !terminal && currentIndex >= 0 && index < currentIndex;
          const label = DELIVERY_STAGE_LABELS[stage];
          return (
            <div key={stage} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-muted-foreground text-xs" aria-hidden>
                  →
                </span>
              ) : null}
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium',
                  isCurrent &&
                    'border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-100',
                  isPast &&
                    !isCurrent &&
                    'border-emerald-300/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
                  !isCurrent && !isPast && 'text-muted-foreground bg-muted/50 border-transparent',
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
        {terminal && lifecycle?.resolution ? (
          <>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium dark:border-stone-600 dark:bg-stone-800">
              {lifecycle.resolution === 'DONE' ? 'Done' : 'Cancelled'}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
