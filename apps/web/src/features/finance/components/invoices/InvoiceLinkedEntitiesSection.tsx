'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isInvoicePayerContextLocked } from '@nbos/shared';
import { FileText, Building2, User, Layers, Repeat, Handshake } from 'lucide-react';
import { DetailSheetEntityLinkGrid, DetailSheetSection } from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useCanViewDeal } from '@/features/crm/hooks/use-can-view-deal';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_COMPANY } from '@/features/finance/constants/invoice-money-status-gate-client';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';
import { InvoiceLinkedReadonlyField } from './InvoiceLinkedReadonlyField';
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
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);
  const deal = invoice.order?.deal ?? null;
  const dealId = deal?.id ?? null;
  const dealTitle = getInvoiceDealTitle(invoice.order);
  // Without deal rights the invoice falls back to its order, which carries the same amounts.
  const showsDeal = Boolean(dealId && dealTitle) && canViewDeal;
  const editsContext = canEditContext && draft != null && patchDraft != null;
  const editsProduct = editsContext && invoice.type === 'MANUAL';
  const hasCompany = Boolean(invoice.company) && !editsContext;
  const hasContact = Boolean(invoice.contact);
  const hasUnlinkedProduct = Boolean(invoice.product && !invoice.projectId) && !editsProduct;
  const hasOrder = Boolean(invoice.order) && !showsDeal;
  const hasSubscription = Boolean(invoice.subscriptionId);
  const hasProjectProduct = Boolean(invoice.product && invoice.projectId) && !editsProduct;
  if (
    !showsDeal &&
    !hasOrder &&
    !hasProjectProduct &&
    !hasSubscription &&
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
      hasOrder={hasOrder}
      hasProjectProduct={hasProjectProduct}
      hasSubscription={hasSubscription}
      orderSheetOpen={orderSheetOpen}
      subscriptionSheetOpen={subscriptionSheetOpen}
      onOrderSheetOpenChange={setOrderSheetOpen}
      onSubscriptionSheetOpenChange={setSubscriptionSheetOpen}
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
  hasOrder,
  hasProjectProduct,
  hasSubscription,
  orderSheetOpen,
  subscriptionSheetOpen,
  onOrderSheetOpenChange,
  onSubscriptionSheetOpenChange,
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
  hasOrder: boolean;
  hasProjectProduct: boolean;
  hasSubscription: boolean;
  orderSheetOpen: boolean;
  subscriptionSheetOpen: boolean;
  onOrderSheetOpenChange: (open: boolean) => void;
  onSubscriptionSheetOpenChange: (open: boolean) => void;
  editsContext: boolean;
  hasCompany: boolean;
  hasUnlinkedProduct: boolean;
  onOpenEntity: (kind: RelationEntityKind, id: string) => void;
}) {
  return (
    <>
      <DetailSheetSection title={title} outlined>
        <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
          {showsDeal && dealTitle && dealId ? (
            <InvoiceLinkedReadonlyField
              label="Deal"
              entityKind="order"
              value={dealId}
              selectionLabel={dealTitle}
              icon={<Handshake size={12} />}
              onOpen={() => onDealSheetOpenChange(true)}
            />
          ) : null}
          {hasOrder && invoice.order ? (
            <InvoiceLinkedReadonlyField
              label="Order"
              entityKind="order"
              value={invoice.order.id}
              selectionLabel={getOrderDisplayTitle(invoice.order)}
              icon={<FileText size={12} />}
              onOpen={() => onOrderSheetOpenChange(true)}
            />
          ) : null}
          {hasProjectProduct && invoice.product ? (
            <InvoiceLinkedReadonlyField
              label="Product"
              entityKind="product"
              value={invoice.product.id}
              selectionLabel={invoice.product.name}
              icon={<Layers size={12} />}
              onOpen={() => onOpenEntity('product', invoice.product!.id)}
            />
          ) : null}
          {hasSubscription && invoice.subscriptionId ? (
            <InvoiceLinkedReadonlyField
              label="Subscription"
              entityKind="order"
              value={invoice.subscriptionId}
              selectionLabel={subscriptionLinkTitle(invoice)}
              icon={<Repeat size={12} />}
              onOpen={() => onSubscriptionSheetOpenChange(true)}
            />
          ) : null}
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
            <InvoiceLinkedReadonlyField
              label="Product"
              entityKind="product"
              value={invoice.product.id}
              selectionLabel={invoice.product.name}
              icon={<Layers size={12} />}
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
              <InvoiceLinkedReadonlyField
                label="Company"
                entityKind="company"
                value={invoice.company.id}
                selectionLabel={invoice.company.name}
                icon={<Building2 size={12} />}
                onOpen={() => onOpenEntity('company', invoice.company!.id)}
              />
            </div>
          ) : null}
          {invoice.contact ? (
            <InvoiceLinkedReadonlyField
              label="Contact"
              entityKind="contact"
              value={invoice.contact.id}
              selectionLabel={`${invoice.contact.firstName} ${invoice.contact.lastName}`.trim()}
              icon={<User size={12} />}
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
      <OrderDetailSheet
        orderId={orderSheetOpen ? (invoice.order?.id ?? null) : null}
        open={orderSheetOpen && Boolean(invoice.order)}
        onOpenChange={onOrderSheetOpenChange}
        onCreateInvoice={() => undefined}
        forceNestedBackdrop
      />
      <SubscriptionDetailSheet
        subscriptionId={subscriptionSheetOpen ? (invoice.subscriptionId ?? null) : null}
        open={subscriptionSheetOpen && Boolean(invoice.subscriptionId)}
        onOpenChange={onSubscriptionSheetOpenChange}
      />
    </>
  );
}

function subscriptionLinkTitle(invoice: InvoiceSheetInvoice): string {
  const name = invoice.subscription?.name?.trim();
  if (name) return name;
  const code = invoice.subscription?.code?.trim();
  if (code) return code;
  return invoice.subscriptionId?.slice(0, 8) ?? '';
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
