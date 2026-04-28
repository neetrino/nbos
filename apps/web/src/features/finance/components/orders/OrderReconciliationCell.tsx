import { AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Order } from '@/lib/api/finance';

interface OrderReconciliationCellProps {
  order: Order;
}

export function OrderReconciliationCell({ order }: OrderReconciliationCellProps) {
  const reconciliation = order.reconciliation;

  if (!reconciliation) {
    return (
      <span className="text-muted-foreground text-xs">{order._count?.invoices ?? 0} invoices</span>
    );
  }

  const invoicePercent = getPercent(reconciliation.invoicedAmount, reconciliation.orderAmount);
  const paidPercent = getPercent(reconciliation.paidAmount, reconciliation.orderAmount);

  return (
    <div className="min-w-44 space-y-2">
      <CoverageRow
        label={`${reconciliation.invoiceCount} invoices`}
        amount={formatAmount(reconciliation.invoicedAmount)}
        percent={invoicePercent}
      />
      <CoverageRow
        label="Paid"
        amount={formatAmount(reconciliation.paidAmount)}
        percent={paidPercent}
      />
      <ReconciliationWarnings order={order} />
    </div>
  );
}

function CoverageRow({
  label,
  amount,
  percent,
}: {
  label: string;
  amount: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{amount}</span>
      </div>
      <Progress value={percent} className="mt-1 h-1.5" />
    </div>
  );
}

function ReconciliationWarnings({ order }: { order: Order }) {
  const warnings = order.reconciliation?.warnings ?? [];
  if (warnings.length === 0) {
    return <p className="text-xs text-green-600">Covered</p>;
  }

  return (
    <div className="space-y-1">
      {warnings.map((warning) => (
        <p key={warning.code} className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle size={12} />
          {warning.message}
        </p>
      ))}
    </div>
  );
}

function getPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}
