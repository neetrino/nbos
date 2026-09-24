'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isInvoicePayerContextLocked } from '@nbos/shared';
import { FileText, Building2, User, Layers, Repeat, Handshake } from 'lucide-react';
import {
  DetailSheetEntityLinkCard,
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { subscriptionsListWithOpenSubscriptionHref } from '@/features/finance/constants/subscription-deep-link';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useCanViewDeal } from '@/features/crm/hooks/use-can-view-deal';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_COMPANY } from '@/features/finance/constants/invoice-money-status-gate-client';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';
import { InvoiceManualContextFields } from './InvoiceManualContextFields';
import type { RelationEntityKind } from '@/components/shared/relation-picker/relation-picker.types';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';

export function InvoiceLinkedEntitiesSection({
  invoice,
  gateRequiredFields = new Set<string>(),
  draft = null,
  patchDraft,
  formDisabled = false,
  canEditContext = false,
}: {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields?: ReadonlySet<string>;
  draft?: InvoiceGeneralDraft | null;
  patchDraft?: (partial: Partial<InvoiceGeneralDraft>) => void;
  formDisabled?: boolean;
  canEditContext?: boolean;
}) {
  const t = useTranslations('invoices');
  const relations = useEntityRelations();
  const canViewDeal = useCanViewDeal();
  const [dealSheetOpen, setDealSheetOpen] = useState(false);
  const deal = invoice.order?.deal ?? null;
  const dealId = deal?.id ?? null;
  const dealTitle = getInvoiceDealTitle(invoice.order);
  // Without deal rights the invoice falls back to its order, which carries the same amounts.
  const showsDeal = Boolean(dealId && dealTitle) && canViewDeal;
  const editsContext = canEditContext && draft != null && patchDraft != null;
  const editsProduct = editsContext && invoice.type === 'MANUAL';
  const cards = buildLinkedHrefCards(invoice, showsDeal, editsProduct);
  const hasCompany = Boolean(invoice.company) && !editsContext;
  const hasContact = Boolean(invoice.contact);
  const hasUnlinkedProduct = Boolean(invoice.product && !invoice.projectId) && !editsProduct;
  if (
    cards.length === 0 &&
    !showsDeal &&
    !hasCompany &&
    !hasContact &&
    !hasUnlinkedProduct &&
    !editsContext
  ) {
    return null;
  }

  return (
    <InvoiceLinkedEntitiesBody
      title={t('sheet.linked')}
      invoice={invoice}
      gateRequiredFields={gateRequiredFields}
      draft={draft}
      patchDraft={patchDraft}
      formDisabled={formDisabled}
      showsDeal={showsDeal}
      dealTitle={dealTitle}
      dealId={dealId}
      dealSheetOpen={dealSheetOpen}
      onDealSheetOpenChange={setDealSheetOpen}
      cards={cards}
      editsContext={editsContext}
      hasCompany={hasCompany}
      hasUnlinkedProduct={hasUnlinkedProduct}
      onOpenEntity={relations.openEntity}
    />
  );
}

function InvoiceLinkedEntitiesBody({
  title,
  invoice,
  gateRequiredFields,
  draft,
  patchDraft,
  formDisabled,
  showsDeal,
  dealTitle,
  dealId,
  dealSheetOpen,
  onDealSheetOpenChange,
  cards,
  editsContext,
  hasCompany,
  hasUnlinkedProduct,
  onOpenEntity,
}: {
  title: string;
  invoice: InvoiceSheetInvoice;
  gateRequiredFields: ReadonlySet<string>;
  draft: InvoiceGeneralDraft | null;
  patchDraft?: (partial: Partial<InvoiceGeneralDraft>) => void;
  formDisabled: boolean;
  showsDeal: boolean;
  dealTitle: string | null;
  dealId: string | null;
  dealSheetOpen: boolean;
  onDealSheetOpenChange: (open: boolean) => void;
  cards: ReturnType<typeof buildLinkedHrefCards>;
  editsContext: boolean;
  hasCompany: boolean;
  hasUnlinkedProduct: boolean;
  onOpenEntity: (kind: RelationEntityKind, id: string) => void;
}) {
  return (
    <>
      <DetailSheetSection title={title}>
        <DetailSheetEntityLinkGrid>
          {showsDeal && dealTitle ? (
            <DetailSheetEntityLinkCard
              icon={Handshake}
              label="Deal"
              title={dealTitle}
              onOpen={() => onDealSheetOpenChange(true)}
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
          {editsContext && draft && patchDraft ? (
            <InvoiceManualContextFields
              embedded
              invoice={invoice}
              draft={draft}
              patchDraft={patchDraft}
              gateRequiredFields={gateRequiredFields}
              disabled={formDisabled}
              readOnly={isInvoicePayerContextLocked({
                moneyStatus: invoice.moneyStatus,
                officialInvoiceRequestSent: invoice.officialInvoiceRequestSent,
              })}
            />
          ) : null}
          {hasUnlinkedProduct && invoice.product ? (
            <DetailSheetEntityLinkCard
              icon={Layers}
              label="Product"
              title={invoice.product.name}
              onOpen={() => onOpenEntity('product', invoice.product!.id)}
            />
          ) : null}
          {hasCompany && invoice.company ? (
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
                onOpen={() => onOpenEntity('company', invoice.company!.id)}
              />
            </div>
          ) : null}
          {invoice.contact ? (
            <DetailSheetEntityLinkCard
              icon={User}
              label="Contact"
              title={`${invoice.contact.firstName} ${invoice.contact.lastName}`.trim()}
              onOpen={() => onOpenEntity('contact', invoice.contact!.id)}
            />
          ) : null}
        </DetailSheetEntityLinkGrid>
      </DetailSheetSection>
      <EntityDealSheetDeepLink
        dealId={dealSheetOpen ? dealId : null}
        open={dealSheetOpen && Boolean(dealId)}
        onOpenChange={onDealSheetOpenChange}
        forceNestedBackdrop
      />
    </>
  );
}

function buildLinkedHrefCards(
  invoice: InvoiceSheetInvoice,
  showsDeal: boolean,
  editsProduct: boolean,
) {
  return [
    invoice.order && !showsDeal
      ? {
          key: `order-${invoice.order.id}`,
          icon: FileText,
          label: 'Order',
          title: getOrderDisplayTitle(invoice.order),
          href: ordersListWithOpenOrderHref(invoice.order.id),
        }
      : null,
    invoice.product && invoice.projectId && !editsProduct
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
  ].filter((row) => row != null);
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
