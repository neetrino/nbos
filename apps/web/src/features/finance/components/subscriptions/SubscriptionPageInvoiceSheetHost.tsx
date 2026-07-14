'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import type { InvoiceSheetStageGateHighlight } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import { invoicesApi, paymentsApi, type Invoice } from '@/lib/api/finance';

type SubscriptionPageInvoiceSheetHostProps = {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutated: () => void;
};

/**
 * Opens {@link InvoiceSheet} on the subscriptions list without navigating to `/finance/invoices`.
 */
export function SubscriptionPageInvoiceSheetHost({
  invoiceId,
  open,
  onOpenChange,
  onMutated,
}: SubscriptionPageInvoiceSheetHostProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] =
    useState<InvoiceSheetStageGateHighlight | null>(null);

  useEffect(() => {
    if (!open || !invoiceId?.trim()) {
      setInvoice(null);
      setLoading(false);
      setStageGateHighlight(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const next = await invoicesApi.getById(invoiceId);
        if (!cancelled) {
          setInvoice(next);
        }
      } catch (caught) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Could not open invoice.'));
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceId, open, onOpenChange]);

  const handlePaymentRecorded = useCallback(
    async (data: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      notes?: string;
    }) => {
      await paymentsApi.create(data);
      const updated = await invoicesApi.getById(data.invoiceId);
      setInvoice(updated);
      onMutated();
    },
    [onMutated],
  );

  const handleMoneyStatusChange = useCallback(
    async (id: string, moneyStatus: string) => {
      try {
        const updated = await invoicesApi.updateMoneyStatus(id, moneyStatus);
        setInvoice(updated);
        setStageGateHighlight(null);
        onMutated();
      } catch (caught) {
        if (isStageGateApiError(caught) && invoice) {
          setStageGateHighlight({ errors: caught.errors });
          return;
        }
        toast.error(
          getApiErrorMessage(caught, 'Could not update invoice money status. Try again.'),
        );
      }
    },
    [invoice, onMutated],
  );

  return (
    <InvoiceSheet
      invoice={invoice}
      open={open}
      loading={loading}
      onOpenChange={onOpenChange}
      onInvoiceUpdated={(updated) => {
        setInvoice(updated);
        onMutated();
      }}
      onInvoiceDeleted={() => {
        onMutated();
        onOpenChange(false);
      }}
      onMoneyStatusChange={handleMoneyStatusChange}
      onPaymentRecorded={handlePaymentRecorded}
      stageGateHighlight={stageGateHighlight}
    />
  );
}
