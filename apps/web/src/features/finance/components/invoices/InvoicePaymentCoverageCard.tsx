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
    isFullyPaid: invoice.status === 'PAID',
  };

  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Payments
      </h4>
      <div className="grid grid-cols-3 gap-2">
        <CoverageMetric label="Paid" value={formatAmount(coverage.paidAmount, invoice.currency)} />
        <CoverageMetric
          label="Outstanding"
          value={formatAmount(coverage.outstandingAmount, invoice.currency)}
          emphasis={coverage.outstandingAmount > 0 ? 'amber' : 'green'}
        />
        <CoverageMetric label="Payments" value={String(coverage.paymentCount)} />
      </div>
      {coverage.isFullyPaid && (
        <p className="flex items-center gap-1 text-xs font-medium text-green-600">
          <DollarSign size={12} />
          Invoice is fully covered by payments.
        </p>
      )}
    </section>
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
  const color =
    emphasis === 'green' ? 'text-green-600' : emphasis === 'amber' ? 'text-amber-600' : '';

  return (
    <div className="bg-secondary/50 rounded-lg p-3 text-center">
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className={`mt-1 text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
