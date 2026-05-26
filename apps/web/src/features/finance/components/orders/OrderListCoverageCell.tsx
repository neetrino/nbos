import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Order } from '@/lib/api/finance';
import { getOrderCoveragePercents } from './order-display-utils';

interface OrderListCoverageCellProps {
  order: Order;
}

export function OrderListCoverageCell({ order }: OrderListCoverageCellProps) {
  const reconciliation = order.reconciliation;
  const percents = getOrderCoveragePercents(order);
  const warnings = reconciliation?.warnings ?? [];

  if (!reconciliation || !percents) {
    return (
      <span className="text-muted-foreground text-xs tabular-nums">
        {order._count?.invoices ?? reconciliation?.invoiceCount ?? 0} invoices
      </span>
    );
  }

  if (warnings.length === 0 && reconciliation.isFullyInvoiced && reconciliation.isFullyPaid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckCircle2 size={13} aria-hidden />
        Covered
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <CoveragePill label="Inv" percent={percents.invoicedPercent} />
        <CoveragePill label="Paid" percent={percents.paidPercent} />
        {warnings.length > 0 ? (
          <AlertTriangle size={13} className="text-amber-600" aria-label="Reconciliation warning" />
        ) : null}
      </div>
      {warnings[0] ? (
        <p className="text-muted-foreground line-clamp-1 text-[11px]">{warnings[0].message}</p>
      ) : null}
    </div>
  );
}

function CoveragePill({ label, percent }: { label: string; percent: number }) {
  const tone =
    percent >= 100
      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
      : 'bg-muted text-muted-foreground';

  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${tone}`}>
      {label} {percent}%
    </span>
  );
}
