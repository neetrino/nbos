'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <p className="text-muted-foreground col-span-2 text-sm">
        Tax-free invoice — official request to accountant is not required.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <OfficialRequestStatus invoice={invoice} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || invoice.officialInvoiceRequestSent}
          onClick={() =>
            runAction(
              () => invoicesApi.sendOfficialInvoiceRequest(invoice.id),
              'Official invoice request marked as sent',
            )
          }
        >
          {busy ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
          Send request
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !invoice.officialInvoiceRequestSent}
          onClick={() =>
            runAction(
              () => invoicesApi.cancelOfficialInvoiceRequest(invoice.id),
              'Previous request cancelled',
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
            runAction(
              () => invoicesApi.sendOfficialInvoiceRequest(invoice.id),
              'Official invoice request sent again',
            )
          }
        >
          Send again
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`gov-id-${invoice.id}`} className="text-xs">
          Government invoice ID
        </Label>
        <div className="flex gap-2">
          <Input
            id={`gov-id-${invoice.id}`}
            value={govDraft}
            onChange={(e) => setGovDraft(e.target.value)}
            placeholder="After accountant creates official invoice"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              runAction(
                () => invoicesApi.updateOfficialInvoiceGovId(invoice.id, govDraft.trim() || null),
                'Government invoice ID saved',
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function OfficialRequestStatus({ invoice }: { invoice: Invoice }) {
  if (invoice.officialInvoiceRequestSent) {
    return (
      <p className="text-sm font-medium text-green-700 dark:text-green-400">
        Request sent
        {invoice.officialInvoiceSentAt
          ? ` · ${formatShortDate(invoice.officialInvoiceSentAt)}`
          : ''}
      </p>
    );
  }
  if (invoice.officialInvoiceCancelledAt) {
    return (
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        Request cancelled · {formatShortDate(invoice.officialInvoiceCancelledAt)}
      </p>
    );
  }
  return <p className="text-muted-foreground text-sm">Request not sent yet</p>;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
