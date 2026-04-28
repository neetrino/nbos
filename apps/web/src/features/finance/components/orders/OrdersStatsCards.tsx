import { formatAmount } from '@/features/finance/constants/finance';
import type { OrderStats } from '@/lib/api/finance';

interface OrdersStatsCardsProps {
  stats: OrderStats | null;
}

export function OrdersStatsCards({ stats }: OrdersStatsCardsProps) {
  const totalOrders = Number(stats?.totalAmount ?? 0);
  const totalPaid = Number(stats?.collectedAmount ?? 0);
  const outstandingAmount = Number(stats?.outstandingAmount ?? 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      <OrderStatCard label="Total Orders" value={formatAmount(totalOrders)} />
      <OrderStatCard
        label="Total Collected"
        value={formatAmount(totalPaid)}
        valueClassName="text-green-600"
      />
      <OrderStatCard
        label="Outstanding"
        value={formatAmount(outstandingAmount)}
        valueClassName="text-amber-500"
      />
    </div>
  );
}

function OrderStatCard({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}
