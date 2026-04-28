import type { Subscription, SubscriptionStats } from '@/lib/api/finance';
import { formatAmount } from '@/features/finance/constants/finance';

interface SubscriptionStatsCardsProps {
  subscriptions: Subscription[];
  stats: SubscriptionStats | null;
}

export function SubscriptionStatsCards({ subscriptions, stats }: SubscriptionStatsCardsProps) {
  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  ).length;
  const totalMRR = Number(stats?.monthlyRevenue ?? 0);
  const activeSubscriptions = stats?.activeSubscriptions ?? activeCount;
  const totalSubscriptions = stats?.total ?? subscriptions.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Monthly Recurring Revenue" value={formatAmount(totalMRR)} emphasis="green" />
      <StatCard label="Active Subscriptions" value={String(activeSubscriptions)} />
      <StatCard label="Total Subscriptions" value={String(totalSubscriptions)} />
    </div>
  );
}

function StatCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'green';
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-xl font-bold ${emphasis === 'green' ? 'text-green-600' : ''}`}>
        {value}
      </p>
    </div>
  );
}
