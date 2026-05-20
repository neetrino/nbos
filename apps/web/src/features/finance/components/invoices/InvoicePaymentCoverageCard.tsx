import { DollarSign } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';

interface InvoicePaymentCoverageCardProps {
  invoice: Invoice;
}

export function InvoicePaymentCoverageCard({ invoice }: InvoicePaymentCoverageCardProps) {
  const coverage = invoice.paymentCoverage ?? {
    paidAmount: 0,
    outstandingAmount: parseFloat(invoice.amount),
    paymentCount: invoice._count.payments,
    isFullyPaid: invoice.moneyStatus === 'PAID',
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <CoverageMetric label="Paid" value={formatAmount(coverage.paidAmount, invoice.currency)} />
        <CoverageMetric
          label="Outstanding"
          value={formatAmount(coverage.outstandingAmount, invoice.currency)}
          emphasis={coverage.outstandingAmount > 0 ? 'amber' : 'green'}
        />
        <CoverageMetric label="Payments" value={String(coverage.paymentCount)} />
      </div>
      {coverage.isFullyPaid ? (
        <p className="flex items-center gap-1 text-xs font-medium text-green-600">
          <DollarSign size={12} aria-hidden />
          Fully covered by recorded payments.
        </p>
      ) : null}
    </div>
  );
}

function CoverageMetric({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'green' | 'amber';
}) {
  const valueClass =
    emphasis === 'green' ? 'text-green-600' : emphasis === 'amber' ? 'text-amber-600' : '';

  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
