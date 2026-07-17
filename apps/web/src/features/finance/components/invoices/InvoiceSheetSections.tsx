'use client';

import { FileText, Building2, User, FolderKanban, Repeat, Handshake } from 'lucide-react';
import {
  DetailSheetEntityLinkCard,
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
  StatusBadge,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { subscriptionsListWithOpenSubscriptionHref } from '@/features/finance/constants/subscription-deep-link';
import type { Invoice } from '@/lib/api/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { RecordPaymentForm } from './RecordPaymentForm';

export type InvoiceSheetInvoice = Invoice;

export function InvoiceSheetBadge({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const money = getInvoiceMoneyStage(invoice.moneyStatus);
  if (!money) return null;
  return <StatusBadge label={money.label} variant={money.variant} className="self-center" />;
}

export function InvoiceOfficialSection({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}) {
  return (
    <DetailSheetSection title="Official invoice">
      {onInvoiceUpdated ? (
        <InvoiceOfficialRequestPanel invoice={invoice} onUpdated={onInvoiceUpdated} />
      ) : (
        <OfficialInvoiceReadOnly invoice={invoice} />
      )}
    </DetailSheetSection>
  );
}

export function InvoiceLinkedEntitiesSection({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const relations = useEntityRelations();
  const deal = invoice.order?.deal ?? null;
  const dealTitle = getInvoiceDealTitle(invoice.order);
  const cards = [
    deal && dealTitle
      ? {
          key: `deal-${deal.id}`,
          icon: Handshake,
          label: 'Deal',
          title: dealTitle,
          href: `/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(deal.id)}`,
        }
      : invoice.order
        ? {
            key: `order-${invoice.order.id}`,
            icon: FileText,
            label: 'Order',
            title: getOrderDisplayTitle(invoice.order),
            href: ordersListWithOpenOrderHref(invoice.order.id),
          }
        : null,
    invoice.project
      ? {
          key: `project-${invoice.project.id}`,
          icon: FolderKanban,
          label: 'Project',
          title: invoice.project.name,
          href: `/projects/${invoice.project.id}`,
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
  if (cards.length === 0 && !hasCompany && !hasContact) return null;

  return (
    <DetailSheetSection title="Linked">
      <DetailSheetEntityLinkGrid>
        {cards.map((row) => (
          <DetailSheetEntityLinkCard
            key={row.key}
            href={row.href}
            icon={row.icon}
            label={row.label}
            title={row.title}
          />
        ))}
        {invoice.company ? (
          <DetailSheetEntityLinkCard
            icon={Building2}
            label="Company"
            title={invoice.company.name}
            onOpen={() => relations.openEntity('company', invoice.company!.id)}
          />
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
  );
}

export function InvoiceDescriptionSection({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <DetailSheetSection title="Description">
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
  return (
    <div className="space-y-4">
      {invoice.paymentCoverage?.isFullyPaid ? (
        <p className="text-sm font-medium text-green-600">Fully paid</p>
      ) : null}
      <RecordPaymentForm
        invoice={invoice}
        onRecordPayment={onPaymentRecorded}
        gateRequiredFields={gateRequiredFields}
      />
      {invoice.payments.length > 0 ? (
        <DetailSheetSection title="Payment proofs">
          <div className="space-y-4">
            {invoice.payments.map((payment) => (
              <FinanceProofAttachments
                key={payment.id}
                entityType="PAYMENT"
                entityId={payment.id}
                purpose="PAYMENT_PROOF"
                title={`Payment proof · ${new Date(payment.paymentDate).toLocaleDateString()}`}
              />
            ))}
          </div>
        </DetailSheetSection>
      ) : null}
    </div>
  );
}

function OfficialInvoiceReadOnly({ invoice }: { invoice: InvoiceSheetInvoice }) {
  if (invoice.taxStatus !== 'TAX') {
    return (
      <p className="text-muted-foreground text-sm">
        Tax-free invoice — accountant request is not required.
      </p>
    );
  }
  const status = invoice.officialInvoiceRequestSent
    ? 'Sent to accountant'
    : invoice.officialInvoiceCancelledAt
      ? 'Cancelled'
      : 'Not sent';
  const variant = invoice.officialInvoiceRequestSent
    ? 'green'
    : invoice.officialInvoiceCancelledAt
      ? 'amber'
      : 'gray';
  return (
    <div className="space-y-2">
      <StatusBadge label={status} variant={variant} />
      {invoice.govInvoiceId ? (
        <p className="text-muted-foreground font-mono text-xs">{invoice.govInvoiceId}</p>
      ) : null}
    </div>
  );
}
