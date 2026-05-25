'use client';

import { useCallback, useState } from 'react';
import { FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InlineField, StatusBadge } from '@/components/shared';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '@/components/shared/detail-sheet-classes';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice } from '@/lib/api/finance';

interface InvoiceOfficialRequestPanelProps {
  invoice: Invoice;
  onUpdated: (invoice: Invoice) => void;
}

export function InvoiceOfficialRequestPanel({
  invoice,
  onUpdated,
}: InvoiceOfficialRequestPanelProps) {
  const [govDraft, setGovDraft] = useState(invoice.govInvoiceId ?? '');
  const [busy, setBusy] = useState(false);

  const runAction = useCallback(
    async (action: () => Promise<Invoice>, successMessage: string) => {
      setBusy(true);
      try {
        const updated = await action();
        onUpdated(updated);
        setGovDraft(updated.govInvoiceId ?? '');
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
        Tax-free invoice — accountant request is not required.
      </p>
    );
  }

  const status = officialRequestStatus(invoice);

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={status.label} variant={status.variant} />
        </div>
        {invoice.officialInvoiceRequestSent && invoice.officialInvoiceSentAt ? (
          <p className="text-muted-foreground text-xs">
            Sent {formatOfficialDate(invoice.officialInvoiceSentAt)}
          </p>
        ) : null}
        {invoice.officialInvoiceCancelledAt && !invoice.officialInvoiceRequestSent ? (
          <p className="text-muted-foreground text-xs">
            Cancelled {formatOfficialDate(invoice.officialInvoiceCancelledAt)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {!invoice.officialInvoiceRequestSent ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
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
              disabled={busy}
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

      <InlineField
        variant="controlled"
        label="Government invoice ID"
        type="text"
        value={govDraft}
        placeholder="ID from accountant after issue"
        icon={<FileCheck size={12} />}
        disabled={busy}
        onValueChange={setGovDraft}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-fit"
        disabled={busy || govDraft === (invoice.govInvoiceId ?? '')}
        onClick={() =>
          void runAction(
            () => invoicesApi.updateOfficialInvoiceGovId(invoice.id, govDraft.trim() || null),
            'Government ID saved',
          )
        }
      >
        Save government ID
      </Button>
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
