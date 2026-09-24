'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOfficialInvoiceOrderCommentSendErrors,
  getOfficialInvoiceRequestSendErrors,
} from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';
import { officialInvoiceRequestStatusKey } from './invoice-message-keys';
import { InvoiceTaxReadinessBanner } from './InvoiceTaxReadinessBanner';
import { useOfficialAwaitingSendPending } from './use-official-awaiting-send-pending';

const ACTION_BUTTON_CLASS = 'min-w-52';

const STATUS_BUTTON_CLASS = {
  gray: 'bg-muted text-foreground hover:bg-muted/80',
  amber: 'bg-amber-500 text-white hover:bg-amber-500/90',
  green: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
} as const;

export function InvoiceOfficialAction({
  invoice,
  onUpdated,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: Invoice;
  onUpdated?: (invoice: Invoice) => void;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const t = useTranslations('invoices');
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const awaitingSend = useOfficialAwaitingSendPending(invoice);

  const send = useCallback(() => {
    if (!onUpdated) return;
    setBusy(true);
    void invoicesApi
      .sendOfficialInvoiceRequest(invoice.id, { resend: invoice.officialInvoiceRequestSent })
      .then((updated) => {
        onUpdated(updated);
        toast.success(
          invoice.officialInvoiceRequestSent
            ? t('official.sentAgain')
            : t('official.sentToAccountant'),
        );
      })
      .catch((caught: unknown) => {
        toast.error(getApiErrorMessage(caught, t('official.actionFailed')));
      })
      .finally(() => setBusy(false));
  }, [invoice.id, invoice.officialInvoiceRequestSent, onUpdated, t]);

  if (invoice.taxStatus !== 'TAX') return null;

  const status = officialInvoiceRequestStatusKey(invoice, awaitingSend);
  const actionLabel = officialActionLabel(invoice, awaitingSend, t);
  const statusLabel = officialStatusCaption(invoice, status.key, locale, t);
  const sendBlocked =
    busy ||
    awaitingSend ||
    invoice.moneyStatus === 'CANCELLED' ||
    !onUpdated ||
    !canSendOfficialRequest(invoice);

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-1.5',
        invoiceStageGateSectionClass(gateRequiredFields, 'officialInvoice'),
      )}
    >
      <InvoiceTaxReadinessBanner invoice={invoice} />
      <div className="flex w-full items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          disabled={sendBlocked}
          onClick={send}
          className={cn(ACTION_BUTTON_CLASS, STATUS_BUTTON_CLASS[status.variant])}
        >
          {busy || awaitingSend ? <Loader2 className="animate-spin" /> : null}
          {actionLabel}
        </Button>
        <p className="text-muted-foreground text-right text-xs">{statusLabel}</p>
      </div>
    </div>
  );
}

function officialActionLabel(
  invoice: Invoice,
  awaitingSend: boolean,
  t: ReturnType<typeof useTranslations<'invoices'>>,
): string {
  if (awaitingSend) return t('official.sending');
  if (invoice.officialInvoiceRequestSent) return t('official.sendAgain');
  return t('official.send');
}

function officialStatusCaption(
  invoice: Invoice,
  statusKey: ReturnType<typeof officialInvoiceRequestStatusKey>['key'],
  locale: string,
  t: ReturnType<typeof useTranslations<'invoices'>>,
): string {
  const label = t(statusKey);
  if (invoice.officialInvoiceRequestSent && invoice.officialInvoiceSentAt) {
    return `${label} · ${formatInvoiceSheetDate(invoice.officialInvoiceSentAt, locale)}`;
  }
  if (invoice.officialInvoiceCancelledAt && !invoice.officialInvoiceRequestSent) {
    return `${label} · ${formatInvoiceSheetDate(invoice.officialInvoiceCancelledAt, locale)}`;
  }
  return label;
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
