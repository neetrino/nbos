'use client';

import { DetailSheetSection } from '@/components/shared';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceRecordedPaymentsList } from './InvoiceRecordedPaymentsList';
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
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}

export function InvoicePaymentsTab({
  invoice,
  gateRequiredFields,
  onPaymentRecorded,
  onInvoiceUpdated,
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

      <InvoiceRecordedPaymentsList invoice={invoice} onInvoiceUpdated={onInvoiceUpdated} />

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
