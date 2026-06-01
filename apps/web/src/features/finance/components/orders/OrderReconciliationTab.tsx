'use client';

import { AlertTriangle, Scale } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { DetailSheetSection, InlineField } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Order } from '@/lib/api/finance';

interface OrderReconciliationTabProps {
  order: Order;
}

export function OrderReconciliationTab({ order }: OrderReconciliationTabProps) {
  const reconciliation = order.reconciliation;

  if (!reconciliation) {
    return (
      <DetailSheetSection title="Reconciliation" icon={<Scale size={12} />}>
        <p className="text-muted-foreground text-sm">
          Reconciliation data is not available for this order.
        </p>
      </DetailSheetSection>
    );
  }

  const invoicePercent = getPercent(reconciliation.invoicedAmount, reconciliation.orderAmount);
  const paidPercent = getPercent(reconciliation.paidAmount, reconciliation.orderAmount);

  return (
    <DetailSheetSection title="Reconciliation" icon={<Scale size={12} />}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InlineField label="Order amount" value={formatAmount(reconciliation.orderAmount)} />
          <InlineField label="Invoiced" value={formatAmount(reconciliation.invoicedAmount)} />
          <InlineField label="Paid" value={formatAmount(reconciliation.paidAmount)} />
          <InlineField label="Uninvoiced" value={formatAmount(reconciliation.uninvoicedAmount)} />
          <InlineField label="Outstanding" value={formatAmount(reconciliation.outstandingAmount)} />
          <InlineField label="Invoices" value={String(reconciliation.invoiceCount)} />
        </div>

        <CoverageBlock
          label="Invoiced coverage"
          amount={formatAmount(reconciliation.invoicedAmount)}
          percent={invoicePercent}
        />
        <CoverageBlock
          label="Paid coverage"
          amount={formatAmount(reconciliation.paidAmount)}
          percent={paidPercent}
        />

        <ReconciliationFlags reconciliation={reconciliation} />
        <ReconciliationWarnings warnings={reconciliation.warnings} />
      </div>
    </DetailSheetSection>
  );
}

function CoverageBlock({
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
      <div className="mb-1.5 flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{amount}</span>
      </div>
      <Progress value={percent} className="h-2" />
      <p className="text-muted-foreground mt-1 text-xs">{percent}% of order amount</p>
    </div>
  );
}

function ReconciliationFlags({
  reconciliation,
}: {
  reconciliation: NonNullable<Order['reconciliation']>;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Flag label="Fully invoiced" active={reconciliation.isFullyInvoiced} />
      <Flag label="Fully paid" active={reconciliation.isFullyPaid} />
    </div>
  );
}

function Flag({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700 dark:bg-green-950 dark:text-green-300'
          : 'bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium'
      }
    >
      {label}
    </span>
  );
}

function ReconciliationWarnings({
  warnings,
}: {
  warnings: NonNullable<Order['reconciliation']>['warnings'];
}) {
  if (warnings.length === 0) {
    return <p className="text-sm text-green-600">All amounts are covered.</p>;
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <p key={warning.code} className="flex items-center gap-1.5 text-sm text-amber-600">
          <AlertTriangle size={14} aria-hidden />
          {warning.message}
        </p>
      ))}
    </div>
  );
}

function getPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
