'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';
import { officialInvoiceRequestStatusKey } from './invoice-message-keys';
import { useOfficialAwaitingSendPending } from './use-official-awaiting-send-pending';

interface InvoiceOfficialRequestPanelProps {
  invoice: Invoice;
  onUpdated: (invoice: Invoice) => void;
}

export function InvoiceOfficialRequestPanel({
  invoice,
  onUpdated,
}: InvoiceOfficialRequestPanelProps) {
  const t = useTranslations('invoices');
  const [busy, setBusy] = useState(false);
  const awaitingSend = useOfficialAwaitingSendPending(invoice);
  const runAction = useOfficialRequestAction(onUpdated, setBusy, t('official.actionFailed'));

  if (invoice.taxStatus !== 'TAX') {
    return <p className="text-muted-foreground text-sm">{t('official.freeNotRequired')}</p>;
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
  failedMessage: string,
) {
  return useCallback(
    async (action: () => Promise<Invoice>, successMessage: string) => {
      setBusy(true);
      try {
        const updated = await action();
        onUpdated(updated);
        toast.success(successMessage);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, failedMessage));
      } finally {
        setBusy(false);
      }
    },
    [failedMessage, onUpdated, setBusy],
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
  const t = useTranslations('invoices');
  const locale = useLocale();
  const copy = officialRequestCopy(invoice, awaitingSend, locale, t);
  const sendDisabled = busy || awaitingSend || !canSendOfficialRequest(invoice);

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <OfficialRequestStatusRow
        statusLabel={copy.statusLabel}
        statusVariant={copy.statusVariant}
        sentAtLabel={copy.sentAtLabel}
        cancelledAtLabel={copy.cancelledAtLabel}
      />
      {invoice.moneyStatus === 'CANCELLED' ? null : (
        <OfficialRequestActions
          requestSent={invoice.officialInvoiceRequestSent}
          busy={busy}
          awaitingSend={awaitingSend}
          sendDisabled={sendDisabled}
          sendLabel={copy.sendLabel}
          cancelLabel={copy.cancelLabel}
          sendAgainLabel={copy.sendAgainLabel}
          onSend={() =>
            void runAction(
              () =>
                invoicesApi.sendOfficialInvoiceRequest(invoice.id, {
                  resend: invoice.officialInvoiceRequestSent,
                }),
              copy.successMessage,
            )
          }
          onCancel={() =>
            void runAction(
              () => invoicesApi.cancelOfficialInvoiceRequest(invoice.id),
              copy.requestCancelled,
            )
          }
        />
      )}
    </div>
  );
}

function officialRequestCopy(
  invoice: Invoice,
  awaitingSend: boolean,
  locale: string,
  t: ReturnType<typeof useTranslations<'invoices'>>,
) {
  const status = officialInvoiceRequestStatusKey(invoice, awaitingSend);
  return {
    statusLabel: t(status.key),
    statusVariant: status.variant,
    sentAtLabel:
      invoice.officialInvoiceRequestSent && invoice.officialInvoiceSentAt
        ? t('official.sentAt', {
            date: formatInvoiceSheetDate(invoice.officialInvoiceSentAt, locale),
          })
        : null,
    cancelledAtLabel:
      invoice.officialInvoiceCancelledAt && !invoice.officialInvoiceRequestSent
        ? t('official.cancelledAt', {
            date: formatInvoiceSheetDate(invoice.officialInvoiceCancelledAt, locale),
          })
        : null,
    successMessage: invoice.officialInvoiceRequestSent
      ? t('official.sentAgain')
      : t('official.sentToAccountant'),
    sendLabel: awaitingSend ? t('official.sending') : t('official.send'),
    cancelLabel: t('official.cancelRequest'),
    sendAgainLabel: t('official.sendAgain'),
    requestCancelled: t('official.requestCancelled'),
  };
}

function OfficialRequestActions({
  requestSent,
  busy,
  awaitingSend,
  sendDisabled,
  sendLabel,
  cancelLabel,
  sendAgainLabel,
  onSend,
  onCancel,
}: {
  requestSent: boolean;
  busy: boolean;
  awaitingSend: boolean;
  sendDisabled: boolean;
  sendLabel: string;
  cancelLabel: string;
  sendAgainLabel: string;
  onSend: () => void;
  onCancel: () => void;
}) {
  if (!requestSent) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={sendDisabled} onClick={onSend}>
          {busy || awaitingSend ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
          {sendLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="button" size="sm" variant="secondary" disabled={sendDisabled} onClick={onSend}>
        {sendAgainLabel}
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
  statusLabel,
  statusVariant,
  sentAtLabel,
  cancelledAtLabel,
}: {
  statusLabel: string;
  statusVariant: 'green' | 'amber' | 'gray';
  sentAtLabel: string | null;
  cancelledAtLabel: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge label={statusLabel} variant={statusVariant} />
      {sentAtLabel ? <span className="text-muted-foreground text-xs">{sentAtLabel}</span> : null}
      {cancelledAtLabel ? (
        <span className="text-muted-foreground text-xs">{cancelledAtLabel}</span>
      ) : null}
    </div>
  );
}
