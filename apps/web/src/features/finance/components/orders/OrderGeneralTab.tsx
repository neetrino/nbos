'use client';

import { useState } from 'react';
import { Building2, DollarSign, FolderKanban, Handshake, User } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetEntityLinkCard,
  DetailSheetMetaDate,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useCanViewDeal } from '@/features/crm/hooks/use-can-view-deal';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { OrderNotesDraft } from '@/features/finance/utils/order-notes-form-state';
import type { Order } from '@/lib/api/finance';

interface OrderGeneralTabProps {
  order: Order;
  draft: OrderNotesDraft;
  patchDraft: (partial: Partial<OrderNotesDraft>) => void;
  formDisabled?: boolean;
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function OrderGeneralTab({
  order,
  draft,
  patchDraft,
  formDisabled = false,
}: OrderGeneralTabProps) {
  const total = Number(order.amount ?? order.totalAmount ?? 0);
  const [orderOpen, setOrderOpen] = useState(true);

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} w-full max-w-none gap-4`}>
      <DetailSheetCollapsibleSection
        title="Order"
        icon={<DollarSign size={12} />}
        open={orderOpen}
        onOpenChange={setOrderOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <InlineField label="Code" value={order.code} />
          <InlineField label="Title" value={getOrderDisplayTitle(order)} />
          <div className="grid grid-cols-2 gap-4">
            <InlineField label="Type" value={order.type} />
            <InlineField label="Payment type" value={order.paymentType} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InlineField label="Amount" value={formatAmount(total)} />
            <InlineField label="Currency" value={order.currency} />
          </div>
          <div className="border-border mt-4 border-t pt-4">
            <DetailSheetMetaDate label="Created" value={formatShortDate(order.createdAt)} />
          </div>
        </div>
      </DetailSheetCollapsibleSection>

      <OrderLinkedPanel order={order} />

      <DetailSheetOptionalDescription
        entityType="generic"
        entityId={order.id}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={formDisabled}
      />
    </div>
  );
}

function OrderLinkedPanel({ order }: { order: Order }) {
  const relations = useEntityRelations();
  const canViewDeal = useCanViewDeal();
  const [dealSheetOpen, setDealSheetOpen] = useState(false);
  const contactName = order.contact
    ? `${order.contact.firstName} ${order.contact.lastName}`.trim()
    : null;
  const dealId = order.deal?.id ?? null;

  return (
    <>
      <DetailSheetSection title="Linked">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DetailSheetEntityLinkCard
            href={`/projects/${order.projectId}`}
            label="Project"
            title={order.project.name}
            icon={FolderKanban}
          />
          {order.company ? (
            <DetailSheetEntityLinkCard
              label="Company"
              title={order.company.name}
              icon={Building2}
              onOpen={() => relations.openEntity('company', order.company!.id)}
            />
          ) : null}
          {order.contact && contactName ? (
            <DetailSheetEntityLinkCard
              label="Contact"
              title={contactName}
              icon={User}
              onOpen={() => relations.openEntity('contact', order.contact!.id)}
            />
          ) : null}
          {dealId && order.deal && canViewDeal ? (
            <DetailSheetEntityLinkCard
              label="Deal"
              title={order.deal.name?.trim() || order.deal.code}
              icon={Handshake}
              onOpen={() => setDealSheetOpen(true)}
            />
          ) : null}
        </div>
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
