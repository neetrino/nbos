'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DetailSheetSection, StatusBadge } from '@/components/shared';
import { getInvoiceSourceCardChrome } from '@/features/finance/utils/invoice-source-card-chrome';
import {
  getInvoiceSourceLabel,
  resolveInvoiceSourceFamily,
} from '@/features/finance/utils/invoice-source-label';
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';
import { invoiceSourceMessageKey, officialInvoiceRequestStatusKey } from './invoice-message-keys';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { RecordPaymentForm } from './RecordPaymentForm';
import { InvoiceTaxReadinessBanner } from './InvoiceTaxReadinessBanner';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';

export type InvoiceSheetInvoice = Invoice;

export function InvoiceSheetBadge({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const t = useTranslations('invoices');
  const sourceKey = invoiceSourceMessageKey(invoice);
  const chrome = getInvoiceSourceCardChrome(resolveInvoiceSourceFamily(invoice));
  return (
    <StatusBadge
      label={sourceKey ? t(sourceKey) : getInvoiceSourceLabel(invoice)}
      variant="blue"
      className={cn('self-center border', chrome.badgeClassName)}
    />
  );
}

export function InvoiceOfficialSection({
  invoice,
  onInvoiceUpdated,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const t = useTranslations('invoices');
  return (
    <DetailSheetSection
      title={t('official.title')}
      className={invoiceStageGateSectionClass(gateRequiredFields, 'officialInvoice')}
    >
      <InvoiceTaxReadinessBanner invoice={invoice} />
      {onInvoiceUpdated ? (
        <InvoiceOfficialRequestPanel invoice={invoice} onUpdated={onInvoiceUpdated} />
      ) : (
        <OfficialInvoiceReadOnly invoice={invoice} />
      )}
    </DetailSheetSection>
  );
}

export function InvoicePaymentsSection({
  invoice,
  onPaymentRecorded,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: InvoiceSheetInvoice;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const t = useTranslations('invoices');
  const locale = useLocale();
  return (
    <div className="space-y-4">
      {invoice.paymentCoverage?.isFullyPaid ? (
        <p className="text-sm font-medium text-green-600">{t('sheet.fullyPaid')}</p>
      ) : null}
      <RecordPaymentForm
        invoice={invoice}
        onRecordPayment={onPaymentRecorded}
        gateRequiredFields={gateRequiredFields}
      />
      {invoice.payments.length > 0 ? (
        <DetailSheetSection title={t('sheet.paymentProofs')}>
          <div className="space-y-4">
            {invoice.payments.map((payment) => (
              <FinanceProofAttachments
                key={payment.id}
                entityType="PAYMENT"
                entityId={payment.id}
                purpose="PAYMENT_PROOF"
                title={t('payments.proofTitle', {
                  date: formatInvoiceSheetDate(payment.paymentDate, locale),
                })}
              />
            ))}
          </div>
        </DetailSheetSection>
      ) : null}
    </div>
  );
}

function OfficialInvoiceReadOnly({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const t = useTranslations('invoices');
  if (invoice.taxStatus !== 'TAX') {
    return <p className="text-muted-foreground text-sm">{t('official.freeNotRequired')}</p>;
  }
  const status = officialInvoiceRequestStatusKey(invoice, false);
  return (
    <div className="space-y-2">
      <StatusBadge label={t(status.key)} variant={status.variant} />
    </div>
  );
}
