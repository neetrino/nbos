'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User, type LucideIcon } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { cn } from '@/lib/utils';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useCanViewDeal } from '@/features/crm/hooks/use-can-view-deal';
import type { RelationEntityKind } from '@/components/shared/relation-picker/relation-picker.types';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';
import {
  buildCommercialEntityRows,
  resolveCommercialContact,
  resolveCommercialDeal,
  resolveCommercialOrder,
  resolveCommercialProduct,
  type CommercialLinkTarget,
} from './delivery-item-commercial-links';

const COMMERCIAL_LINK_STACK_CLASS = 'flex flex-col gap-2';

interface DeliveryItemCommercialSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  sourcePageHref: string;
  credentialsTabHref: string;
  gateRequiredFields?: ReadonlySet<string>;
}

function CommercialEntityRow({
  label,
  entityKind,
  target,
  icon: Icon,
  onOpen,
}: {
  label: string;
  entityKind: RelationEntityKind;
  target: CommercialLinkTarget;
  icon: LucideIcon;
  onOpen: () => void;
}) {
  return (
    <InvoiceLinkedReadonlyField
      label={label}
      entityKind={entityKind}
      value={target.id}
      selectionLabel={target.label}
      icon={<Icon size={12} />}
      onOpen={onOpen}
    />
  );
}

function CommercialLinkedFields(props: {
  contact: CommercialLinkTarget | null;
  deal: CommercialLinkTarget | null;
  order: CommercialLinkTarget | null;
  productLink: CommercialLinkTarget | null;
  credentialsHref: string;
  sourcePageHref: string;
  onOpenDeal: () => void;
  onOpenOrder: () => void;
}) {
  const t = useTranslations('deliveryBoard');
  const router = useRouter();
  const relations = useEntityRelations();
  const { contact } = props;
  const rows = buildCommercialEntityRows({
    deal: props.deal,
    order: props.order,
    productLink: props.productLink,
    credentialsHref: props.credentialsHref,
    labels: {
      deal: t('commercial.deal'),
      order: t('commercial.order'),
      product: t('commercial.product'),
      credentials: t('commercial.credentials'),
    },
    onOpenDeal: props.onOpenDeal,
    onOpenOrder: props.onOpenOrder,
    onOpenProduct: () => router.push(props.sourcePageHref),
    onOpenCredentials: () => router.push(props.credentialsHref),
  });

  return (
    <div className={COMMERCIAL_LINK_STACK_CLASS}>
      {contact ? (
        <CommercialEntityRow
          label={t('commercial.client')}
          entityKind="contact"
          target={contact}
          icon={User}
          onOpen={() => relations.openEntity('contact', contact.id)}
        />
      ) : (
        <p className="text-muted-foreground px-1 py-1 text-xs">{t('commercial.noClient')}</p>
      )}
      {rows.map(({ key, ...row }) => (
        <CommercialEntityRow key={key} {...row} />
      ))}
    </div>
  );
}

function CommercialNestedSheets({
  dealId,
  orderId,
  dealOpen,
  orderOpen,
  onDealOpenChange,
  onOrderOpenChange,
}: {
  dealId: string | null;
  orderId: string | null;
  dealOpen: boolean;
  orderOpen: boolean;
  onDealOpenChange: (open: boolean) => void;
  onOrderOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <EntityDealSheetDeepLink
        dealId={dealOpen ? dealId : null}
        open={dealOpen && Boolean(dealId)}
        onOpenChange={onDealOpenChange}
        forceNestedBackdrop
      />
      <OrderDetailSheet
        orderId={orderOpen ? orderId : null}
        open={orderOpen && Boolean(orderId)}
        onOpenChange={onOrderOpenChange}
        onCreateInvoice={() => undefined}
        canQuickCreateInvoice={false}
        forceNestedBackdrop
      />
    </>
  );
}

export function DeliveryItemCommercialSection({
  kind,
  product,
  extension,
  sourcePageHref,
  credentialsTabHref,
  gateRequiredFields = new Set(),
}: DeliveryItemCommercialSectionProps) {
  const t = useTranslations('deliveryBoard');
  const canViewDeal = useCanViewDeal();
  const [dealSheetOpen, setDealSheetOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const contact = resolveCommercialContact(kind, product, extension);
  const deal = resolveCommercialDeal(kind, product, extension, canViewDeal);
  const order = resolveCommercialOrder(kind, product, extension);
  const productLink = resolveCommercialProduct(kind, product, extension);
  const gateClass =
    gateRequiredFields.has('order') || gateRequiredFields.has('finance')
      ? deliveryStageGateSectionClass(gateRequiredFields, 'order')
      : undefined;

  return (
    <>
      <DetailSheetSection title={t('commercial.title')} outlined className={cn(gateClass)}>
        <CommercialLinkedFields
          contact={contact}
          deal={deal}
          order={order}
          productLink={productLink}
          credentialsHref={credentialsTabHref}
          sourcePageHref={sourcePageHref}
          onOpenDeal={() => setDealSheetOpen(true)}
          onOpenOrder={() => setOrderSheetOpen(true)}
        />
      </DetailSheetSection>
      <CommercialNestedSheets
        dealId={deal?.id ?? null}
        orderId={order?.id ?? null}
        dealOpen={dealSheetOpen}
        orderOpen={orderSheetOpen}
        onDealOpenChange={setDealSheetOpen}
        onOrderOpenChange={setOrderSheetOpen}
      />
    </>
  );
}
