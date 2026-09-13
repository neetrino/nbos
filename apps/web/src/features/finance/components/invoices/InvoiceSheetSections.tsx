'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Building2, User, Layers, Repeat, Handshake } from 'lucide-react';
import {
  DetailSheetEntityLinkCard,
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
  StatusBadge,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { getInvoiceSourceLabel } from '@/features/finance/utils/invoice-source-label';
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';
import { invoiceSourceMessageKey, officialInvoiceRequestStatusKey } from './invoice-message-keys';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { subscriptionsListWithOpenSubscriptionHref } from '@/features/finance/constants/subscription-deep-link';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import type { Invoice } from '@/lib/api/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { RecordPaymentForm } from './RecordPaymentForm';
import { InvoiceTaxReadinessBanner } from './InvoiceTaxReadinessBanner';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_COMPANY } from '@/features/finance/constants/invoice-money-status-gate-client';

export type InvoiceSheetInvoice = Invoice;

export function InvoiceSheetBadge({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const t = useTranslations('invoices');
  const sourceKey = invoiceSourceMessageKey(invoice);
  return (
    <StatusBadge
      label={sourceKey ? t(sourceKey) : getInvoiceSourceLabel(invoice)}
      variant="blue"
      className="self-center"
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

export function InvoiceLinkedEntitiesSection({
  invoice,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const t = useTranslations('invoices');
  const relations = useEntityRelations();
  const [dealSheetOpen, setDealSheetOpen] = useState(false);
  const deal = invoice.order?.deal ?? null;
  const dealId = deal?.id ?? null;
  const dealTitle = getInvoiceDealTitle(invoice.order);
  const hasDeal = Boolean(dealId && dealTitle);
  const cards = [
    invoice.order && !hasDeal
      ? {
          key: `order-${invoice.order.id}`,
          icon: FileText,
          label: 'Order',
          title: getOrderDisplayTitle(invoice.order),
          href: ordersListWithOpenOrderHref(invoice.order.id),
        }
      : null,
    invoice.product && invoice.projectId
      ? {
          key: `product-${invoice.product.id}`,
          icon: Layers,
          label: 'Product',
          title: invoice.product.name,
          href: `/projects/${invoice.projectId}/products/${invoice.product.id}`,
        }
      : null,
    invoice.subscriptionId
      ? {
          key: `sub-${invoice.subscriptionId}`,
          icon: Repeat,
          label: 'Subscription',
          title: invoice.subscriptionId.slice(0, 8),
          href: subscriptionsListWithOpenSubscriptionHref(invoice.subscriptionId),
        }
      : null,
  ].filter(
    (
      row,
    ): row is {
      key: string;
      icon: typeof FileText;
      label: string;
      title: string;
      href: string;
    } => row != null,
  );

  const hasCompany = Boolean(invoice.company);
  const hasContact = Boolean(invoice.contact);
  const hasUnlinkedProduct = Boolean(invoice.product && !invoice.projectId);
  if (cards.length === 0 && !hasDeal && !hasCompany && !hasContact && !hasUnlinkedProduct) {
    return null;
  }

  return (
    <>
      <DetailSheetSection title={t('sheet.linked')}>
        <DetailSheetEntityLinkGrid>
          {hasDeal && dealTitle ? (
            <DetailSheetEntityLinkCard
              icon={Handshake}
              label="Deal"
              title={dealTitle}
              onOpen={() => setDealSheetOpen(true)}
            />
          ) : null}
          {cards.map((row) => (
            <DetailSheetEntityLinkCard
              key={row.key}
              href={row.href}
              icon={row.icon}
              label={row.label}
              title={row.title}
            />
          ))}
          {hasUnlinkedProduct && invoice.product ? (
            <DetailSheetEntityLinkCard
              icon={Layers}
              label="Product"
              title={invoice.product.name}
              onOpen={() => relations.openEntity('product', invoice.product!.id)}
            />
          ) : null}
          {invoice.company ? (
            <div
              className={invoiceStageGateSectionClass(
                companyGateFields(gateRequiredFields),
                INVOICE_GATE_FIELD_COMPANY,
              )}
            >
              <DetailSheetEntityLinkCard
                icon={Building2}
                label="Company"
                title={invoice.company.name}
                onOpen={() => relations.openEntity('company', invoice.company!.id)}
              />
            </div>
          ) : null}
          {invoice.contact ? (
            <DetailSheetEntityLinkCard
              icon={User}
              label="Contact"
              title={`${invoice.contact.firstName} ${invoice.contact.lastName}`.trim()}
              onOpen={() => relations.openEntity('contact', invoice.contact!.id)}
            />
          ) : null}
        </DetailSheetEntityLinkGrid>
      </DetailSheetSection>

      <EntityDealSheetDeepLink
        dealId={dealSheetOpen ? dealId : null}
        open={dealSheetOpen && Boolean(dealId)}
        onOpenChange={setDealSheetOpen}
        forceNestedBackdrop
      />
    </>
  );
}

export function InvoiceDescriptionSection({ description }: { description: string | null }) {
  const t = useTranslations('invoices');
  if (!description) return null;
  return (
    <DetailSheetSection title={t('sheet.description')}>
      <p className="text-foreground text-sm leading-relaxed">{description}</p>
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

function companyGateFields(required: ReadonlySet<string>): ReadonlySet<string> {
  if (
    required.has(INVOICE_GATE_FIELD_COMPANY) ||
    required.has('companyName') ||
    required.has('companyTaxId')
  ) {
    return new Set([INVOICE_GATE_FIELD_COMPANY]);
  }
  return new Set();
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
