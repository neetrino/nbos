'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, paymentsApi, type Payment } from '@/lib/api/finance';
import { DeleteInvoicePaymentDialog } from './DeleteInvoicePaymentDialog';
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';

interface InvoiceRecordedPaymentsListProps {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}

export function InvoiceRecordedPaymentsList({
  invoice,
  onInvoiceUpdated,
}: InvoiceRecordedPaymentsListProps) {
  const t = useTranslations('invoices');
  const locale = useLocale();
  const [paymentToRemove, setPaymentToRemove] = useState<Payment | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (invoice.payments.length === 0) return null;

  const canRemove = Boolean(onInvoiceUpdated);
  const paymentSummary =
    paymentToRemove !== null
      ? recordedPaymentSummary(paymentToRemove, invoice.currency, locale)
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
      setDeleteError(getApiErrorMessage(caught, t('payments.removeFailed')));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <DetailSheetSection title={t('payments.recordedTitle')}>
        <ul className="space-y-2 text-sm">
          {invoice.payments.map((payment) => (
            <RecordedPaymentRow
              key={payment.id}
              payment={payment}
              currency={invoice.currency}
              locale={locale}
              canRemove={canRemove}
              removeAria={t('payments.removeAria', {
                amount: formatAmount(parseFloat(String(payment.amount)), invoice.currency),
              })}
              onRemove={() => {
                setDeleteError(null);
                setPaymentToRemove(payment);
              }}
            />
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

function RecordedPaymentRow({
  payment,
  currency,
  locale,
  canRemove,
  removeAria,
  onRemove,
}: {
  payment: Payment;
  currency: string;
  locale: string;
  canRemove: boolean;
  removeAria: string;
  onRemove: () => void;
}) {
  const amountLabel = formatAmount(parseFloat(String(payment.amount)), currency);
  return (
    <li className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0">
      <span>{formatInvoiceSheetDate(payment.paymentDate, locale)}</span>
      <span className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">{amountLabel}</span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            aria-label={removeAria}
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </Button>
        ) : null}
      </span>
    </li>
  );
}

function recordedPaymentSummary(payment: Payment, currency: string, locale: string): string {
  return `${formatAmount(parseFloat(String(payment.amount)), currency)} · ${formatInvoiceSheetDate(payment.paymentDate, locale)}`;
}
