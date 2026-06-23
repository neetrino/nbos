'use client';

import { DetailSheetSection } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { RecordPaymentForm } from './RecordPaymentForm';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';

interface InvoicePaymentsTabProps {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields: ReadonlySet<string>;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
}

export function InvoicePaymentsTab({
  invoice,
  gateRequiredFields,
  onPaymentRecorded,
}: InvoicePaymentsTabProps) {
  return (
    <div className="space-y-4">
      {invoice.paymentCoverage?.isFullyPaid ? (
        <p className="text-sm font-medium text-green-600">Fully paid</p>
      ) : null}
      <RecordPaymentForm
        invoice={invoice}
        onRecordPayment={onPaymentRecorded}
        gateRequiredFields={gateRequiredFields}
      />

      {invoice.payments.length > 0 ? (
        <DetailSheetSection title="Recorded payments">
          <ul className="space-y-2 text-sm">
            {invoice.payments.map((payment) => (
              <li
                key={payment.id}
                className="border-border flex flex-wrap items-baseline justify-between gap-2 border-b pb-2 last:border-0"
              >
                <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                <span className="font-semibold tabular-nums">
                  {formatAmount(parseFloat(String(payment.amount)), invoice.currency)}
                </span>
              </li>
            ))}
          </ul>
        </DetailSheetSection>
      ) : null}

      {invoice.payments.length > 0 ? (
        <DetailSheetSection title="Payment proofs">
          <div className="space-y-4">
            {invoice.payments.map((payment) => (
              <FinanceProofAttachments
                key={payment.id}
                entityType="PAYMENT"
                entityId={payment.id}
                purpose="PAYMENT_PROOF"
                title={new Date(payment.paymentDate).toLocaleDateString()}
              />
            ))}
          </div>
        </DetailSheetSection>
      ) : null}
    </div>
  );
}
