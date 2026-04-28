import { formatAmount } from '@/features/finance/constants/finance';
import type { InvoiceStats } from '@/lib/api/finance';

interface InvoiceStatsCardsProps {
  stats: InvoiceStats | null;
}

export function InvoiceStatsCards({ stats }: InvoiceStatsCardsProps) {
  const totalAmount =
    stats?.byStatus.reduce((sum, item) => sum + Number(item._sum.amount ?? 0), 0) ?? 0;
  const paidAmount = Number(stats?.totalRevenue ?? 0);
  const overdueAmount = Number(stats?.overdue.amount ?? 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total Invoiced" value={formatAmount(totalAmount)} />
      <StatCard label="Collected" value={formatAmount(paidAmount)} emphasis="green" />
      <StatCard label="Overdue" value={formatAmount(overdueAmount)} emphasis="red" />
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
  emphasis?: 'green' | 'red';
}) {
  const color = emphasis === 'green' ? 'text-green-600' : emphasis === 'red' ? 'text-red-500' : '';

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
