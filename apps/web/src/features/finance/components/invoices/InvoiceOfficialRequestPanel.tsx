'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '@/components/shared/detail-sheet-classes';
import { getApiErrorMessage } from '@/lib/api-errors';
import { getOfficialInvoiceRequestSendErrors } from '@nbos/shared';
import { invoicesApi, type Invoice } from '@/lib/api/finance';

interface InvoiceOfficialRequestPanelProps {
  invoice: Invoice;
  onUpdated: (invoice: Invoice) => void;
}

export function InvoiceOfficialRequestPanel({
  invoice,
  onUpdated,
}: InvoiceOfficialRequestPanelProps) {
  const [busy, setBusy] = useState(false);

  const runAction = useCallback(
    async (action: () => Promise<Invoice>, successMessage: string) => {
      setBusy(true);
      try {
        const updated = await action();
        onUpdated(updated);
        toast.success(successMessage);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Action failed. Try again.'));
      } finally {
        setBusy(false);
      }
    },
    [onUpdated],
  );

  if (invoice.taxStatus !== 'TAX') {
    return (
      <p className="text-muted-foreground text-sm">
        Free invoice — accountant request is not required.
      </p>
    );
  }

  const status = officialRequestStatus(invoice);
  const sendBlocked = getOfficialInvoiceRequestSendErrors({
    taxStatus: invoice.taxStatus,
    companyId: invoice.companyId,
    company: invoice.company,
  });
  const canSend = sendBlocked.length === 0;
  const showSendActions = invoice.moneyStatus !== 'CANCELLED';

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status.label} variant={status.variant} />
        {invoice.officialInvoiceRequestSent && invoice.officialInvoiceSentAt ? (
          <span className="text-muted-foreground text-xs">
            Sent {formatOfficialDate(invoice.officialInvoiceSentAt)}
          </span>
        ) : null}
        {invoice.officialInvoiceCancelledAt && !invoice.officialInvoiceRequestSent ? (
          <span className="text-muted-foreground text-xs">
            on {formatOfficialDate(invoice.officialInvoiceCancelledAt)}
          </span>
        ) : null}
      </div>

      {showSendActions ? (
        <div className="flex flex-wrap gap-2">
          {!invoice.officialInvoiceRequestSent ? (
            <Button
              type="button"
              size="sm"
              disabled={busy || !canSend}
              onClick={() =>
                void runAction(
                  () => invoicesApi.sendOfficialInvoiceRequest(invoice.id),
                  'Request sent to accountant',
                )
              }
            >
              {busy ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
              Send to accountant
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () => invoicesApi.cancelOfficialInvoiceRequest(invoice.id),
                    'Request cancelled',
                  )
                }
              >
                Cancel request
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy || !canSend}
                onClick={() =>
                  void runAction(
                    () => invoicesApi.sendOfficialInvoiceRequest(invoice.id),
                    'Request sent again',
                  )
                }
              >
                Send again
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function officialRequestStatus(invoice: Invoice): {
  label: string;
  variant: 'green' | 'amber' | 'gray';
} {
  if (invoice.officialInvoiceRequestSent) {
    return { label: 'Sent to accountant', variant: 'green' };
  }
  if (invoice.officialInvoiceCancelledAt) {
    return { label: 'Cancelled', variant: 'amber' };
  }
  return { label: 'Not sent', variant: 'gray' };
}

function formatOfficialDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
