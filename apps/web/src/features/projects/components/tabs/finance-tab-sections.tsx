import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import {
  projectExpensesBacklogDrilldownHref,
  projectExpensesDrilldownHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { ProjectDomain, ProjectExpense, ProjectSubscription } from '@/lib/api/projects';
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

export function FinanceExpensesSection({
  expenses,
  projectId,
}: {
  expenses: ProjectExpense[];
  projectId: string;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Expenses ({expenses.length})</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={projectExpensesDrilldownHref(projectId)}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            Open in Finance
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
          <Link
            href={projectExpensesBacklogDrilldownHref(projectId)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            Deferred backlog
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Expense</th>
              <th className="px-4 py-2 text-left font-medium">Category</th>
              <th className="px-4 py-2 text-left font-medium">Frequency</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-border border-t">
                <td className="px-4 py-2 font-medium">
                  {exp.name}
                  {exp.isPassThrough ? (
                    <StatusBadge label="Pass-through" variant="gray" className="ml-2" />
                  ) : null}
                </td>
                <td className="text-muted-foreground px-4 py-2">{exp.category}</td>
                <td className="text-muted-foreground px-4 py-2">
                  {exp.frequency.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-2 text-right font-medium">{formatAmount(exp.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
