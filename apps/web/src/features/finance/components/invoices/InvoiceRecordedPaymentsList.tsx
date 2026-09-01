'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, paymentsApi, type Payment } from '@/lib/api/finance';
import { DeleteInvoicePaymentDialog } from './DeleteInvoicePaymentDialog';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';

function formatPaymentDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface InvoiceRecordedPaymentsListProps {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}

export function InvoiceRecordedPaymentsList({
  invoice,
  onInvoiceUpdated,
}: InvoiceRecordedPaymentsListProps) {
  const [paymentToRemove, setPaymentToRemove] = useState<Payment | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (invoice.payments.length === 0) return null;

  const canRemove = Boolean(onInvoiceUpdated);
  const paymentSummary =
    paymentToRemove !== null
      ? `${formatAmount(parseFloat(String(paymentToRemove.amount)), invoice.currency)} · ${formatPaymentDate(paymentToRemove.paymentDate)}`
      : '';

  const handleConfirmRemovePayment = async () => {
    if (!paymentToRemove || !onInvoiceUpdated) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await paymentsApi.delete(paymentToRemove.id);
      const updated = await invoicesApi.getById(invoice.id);
      onInvoiceUpdated(updated);
      setPaymentToRemove(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, 'Payment could not be removed. Try again.'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <DetailSheetSection title="Recorded payments">
        <ul className="space-y-2 text-sm">
          {invoice.payments.map((payment) => (
            <li
              key={payment.id}
              className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
            >
              <span>{formatPaymentDate(payment.paymentDate)}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {formatAmount(parseFloat(String(payment.amount)), invoice.currency)}
                </span>
                {canRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove payment ${formatAmount(parseFloat(String(payment.amount)), invoice.currency)}`}
                    onClick={() => {
                      setDeleteError(null);
                      setPaymentToRemove(payment);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </DetailSheetSection>

      {canRemove ? (
        <DeleteInvoicePaymentDialog
          paymentSummary={paymentSummary}
          open={paymentToRemove !== null}
          isSubmitting={deleteSubmitting}
          errorMessage={deleteError}
          onOpenChange={(next) => {
            if (!next) {
              setPaymentToRemove(null);
              setDeleteError(null);
            }
          }}
          onConfirm={handleConfirmRemovePayment}
        />
      ) : null}
    </>
  );
}
