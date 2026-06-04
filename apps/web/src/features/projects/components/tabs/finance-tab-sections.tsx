import { StatusBadge } from '@/components/shared';
import type { ProjectSubscription } from '@/lib/api/projects';
import {
  formatProjectFinanceAmount,
  projectSubscriptionMonthlyAmount,
} from '@/features/projects/utils/project-finance-amount';
import { cn } from '@/lib/utils';

const SUB_STATUS_MAP: Record<
  string,
  { label: string; variant: 'green' | 'amber' | 'red' | 'gray' | 'blue' }
> = {
  PENDING: { label: 'Pending', variant: 'amber' },
  ACTIVE: { label: 'Active', variant: 'green' },
  ON_HOLD: { label: 'On Hold', variant: 'gray' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  COMPLETED: { label: 'Completed', variant: 'blue' },
};

export function FinanceSubscriptionsSection({
  subscriptions,
  onOpenSubscription,
}: {
  subscriptions: ProjectSubscription[];
  onOpenSubscription?: (subscription: ProjectSubscription) => void;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Subscriptions ({subscriptions.length})</h3>
      <div className="space-y-3">
        {subscriptions.map((sub) => {
          const st = SUB_STATUS_MAP[sub.status];
          const clickable = Boolean(onOpenSubscription);
          return (
            <button
              key={sub.id}
              type="button"
              disabled={!clickable}
              onClick={() => onOpenSubscription?.(sub)}
              className={cn(
                'bg-card border-border w-full rounded-xl border p-4 text-left',
                clickable && 'hover:bg-muted/40 transition-colors',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{sub.code}</p>
                  {st ? <StatusBadge label={st.label} variant={st.variant} /> : null}
                </div>
                <p className="font-bold">
                  {formatProjectFinanceAmount(projectSubscriptionMonthlyAmount(sub))} / mo
                </p>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {sub.type.replace(/_/g, ' ')} · Billing day: {sub.billingDay} · Since{' '}
                {new Date(sub.billingStartDate).toLocaleDateString()}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
