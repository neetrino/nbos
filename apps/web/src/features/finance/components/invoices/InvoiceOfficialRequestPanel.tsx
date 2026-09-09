'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '@/components/shared/detail-sheet-classes';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  getOfficialInvoiceOrderCommentSendErrors,
  getOfficialInvoiceRequestSendErrors,
} from '@nbos/shared';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { useOfficialAwaitingSendPending } from './use-official-awaiting-send-pending';

interface InvoiceOfficialRequestPanelProps {
  invoice: Invoice;
  onUpdated: (invoice: Invoice) => void;
}

export function InvoiceOfficialRequestPanel({
  invoice,
  onUpdated,
}: InvoiceOfficialRequestPanelProps) {
  const [busy, setBusy] = useState(false);
  const awaitingSend = useOfficialAwaitingSendPending(invoice);
  const runAction = useOfficialRequestAction(onUpdated, setBusy);

  if (invoice.taxStatus !== 'TAX') {
    return (
      <p className="text-muted-foreground text-sm">
        Free invoice — accountant request is not required.
      </p>
    );
  }

  return (
    <TaxOfficialRequestPanel
      invoice={invoice}
      busy={busy}
      awaitingSend={awaitingSend}
      runAction={runAction}
    />
  );
}

function useOfficialRequestAction(
  onUpdated: (invoice: Invoice) => void,
  setBusy: (busy: boolean) => void,
) {
  return useCallback(
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
    [onUpdated, setBusy],
  );
}

function TaxOfficialRequestPanel({
  invoice,
  busy,
  awaitingSend,
  runAction,
}: {
  invoice: Invoice;
  busy: boolean;
  awaitingSend: boolean;
  runAction: (action: () => Promise<Invoice>, successMessage: string) => Promise<void>;
}) {
  const status = officialRequestStatus(invoice, awaitingSend);
  const sendDisabled = busy || awaitingSend || !canSendOfficialRequest(invoice);

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <OfficialRequestStatusRow invoice={invoice} status={status} />
      {invoice.moneyStatus === 'CANCELLED' ? null : (
        <OfficialRequestActions
          invoice={invoice}
          busy={busy}
          awaitingSend={awaitingSend}
          sendDisabled={sendDisabled}
          onSend={() =>
            void runAction(
              () =>
                invoicesApi.sendOfficialInvoiceRequest(invoice.id, {
                  resend: invoice.officialInvoiceRequestSent,
                }),
              invoice.officialInvoiceRequestSent
                ? 'Request sent again'
                : 'Request sent to accountant',
            )
          }
          onCancel={() =>
            void runAction(
              () => invoicesApi.cancelOfficialInvoiceRequest(invoice.id),
              'Request cancelled',
            )
          }
        />
      )}
    </div>
  );
}

function OfficialRequestActions({
  invoice,
  busy,
  awaitingSend,
  sendDisabled,
  onSend,
  onCancel,
}: {
  invoice: Invoice;
  busy: boolean;
  awaitingSend: boolean;
  sendDisabled: boolean;
  onSend: () => void;
  onCancel: () => void;
}) {
  if (!invoice.officialInvoiceRequestSent) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={sendDisabled} onClick={onSend}>
          {busy || awaitingSend ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
          {awaitingSend ? 'Sending to accountant' : 'Send to accountant'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
        Cancel request
      </Button>
      <Button type="button" size="sm" variant="secondary" disabled={sendDisabled} onClick={onSend}>
        Send again
      </Button>
    </div>
  );
}

function canSendOfficialRequest(invoice: Invoice): boolean {
  return (
    getOfficialInvoiceRequestSendErrors({
      taxStatus: invoice.taxStatus,
      companyId: invoice.companyId,
      company: invoice.company,
    }).length === 0 &&
    getOfficialInvoiceOrderCommentSendErrors({
      orderId: invoice.orderId,
      orderComment: invoice.orderComment,
    }).length === 0
  );
}

function OfficialRequestStatusRow({
  invoice,
  status,
}: {
  invoice: Invoice;
  status: { label: string; variant: 'green' | 'amber' | 'gray' };
}) {
  return (
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
  );
}

function officialRequestStatus(
  invoice: Invoice,
  awaitingSend: boolean,
): {
  label: string;
  variant: 'green' | 'amber' | 'gray';
} {
  if (invoice.officialInvoiceRequestSent) {
    return { label: 'Sent to accountant', variant: 'green' };
  }
  if (awaitingSend) {
    return { label: 'Sending to accountant', variant: 'amber' };
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
