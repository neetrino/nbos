import Link from 'next/link';
import { StatusBadge } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import type { ProjectDomain, ProjectSubscription } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

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

export function FinanceDomainsSection({ domains }: { domains: ProjectDomain[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Domains ({domains.length})</h3>
      <div className="space-y-2">
        {domains.map((dom) => (
          <div
            key={dom.id}
            className="bg-card border-border flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div>
              <p className="font-mono text-sm font-medium">{dom.domainName}</p>
              <p className="text-muted-foreground text-xs">
                {dom.provider ?? ''} ·{' '}
                {dom.expiryDate
                  ? `Expires ${new Date(dom.expiryDate).toLocaleDateString()}`
                  : 'No expiry'}
              </p>
              {dom.clientServiceRecordId ? (
                <Link
                  href={`/finance/client-services?open=${dom.clientServiceRecordId}`}
                  className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto px-0')}
                >
                  Client service record
                </Link>
              ) : null}
            </div>
            <StatusBadge
              label={dom.status.replace(/_/g, ' ')}
              variant={
                dom.status === 'ACTIVE'
                  ? 'green'
                  : dom.status === 'EXPIRING_SOON'
                    ? 'amber'
                    : dom.status === 'EXPIRED'
                      ? 'red'
                      : 'gray'
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
