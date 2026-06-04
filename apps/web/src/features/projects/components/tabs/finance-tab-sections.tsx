import { StatusBadge } from '@/components/shared';
import type { ProjectSubscription } from '@/lib/api/projects';

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('en-US');
}

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
}: {
  subscriptions: ProjectSubscription[];
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Subscriptions ({subscriptions.length})</h3>
      <div className="space-y-3">
        {subscriptions.map((sub) => {
          const st = SUB_STATUS_MAP[sub.status];
          return (
            <div key={sub.id} className="bg-card border-border rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{sub.code}</p>
                  {st && <StatusBadge label={st.label} variant={st.variant} />}
                </div>
                <p className="font-bold">{formatAmount(sub.amount)} / mo</p>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {sub.type.replace(/_/g, ' ')} · Billing day: {sub.billingDay} · Since{' '}
                {new Date(sub.startDate).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
