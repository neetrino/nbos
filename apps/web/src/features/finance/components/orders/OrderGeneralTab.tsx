'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Building2, DollarSign, FolderKanban, Handshake, User } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetEntityLinkGrid,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useCanViewDeal } from '@/features/crm/hooks/use-can-view-deal';
import { formatInvoiceSheetDate } from '@/features/finance/components/invoices/format-invoice-sheet-date';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';
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

export function OrderGeneralTab({
  order,
  draft,
  patchDraft,
  formDisabled = false,
}: OrderGeneralTabProps) {
  const locale = useLocale();
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
      <p className="text-muted-foreground text-sm">
        Created {formatInvoiceSheetDate(order.createdAt, locale)}
      </p>
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
      <DetailSheetSection title="Linked" outlined>
        <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
          <InvoiceLinkedReadonlyField
            label="Project"
            entityKind="project"
            value={order.projectId}
            selectionLabel={order.project.name}
            icon={<FolderKanban size={12} />}
            onOpen={() => relations.openEntity('project', order.projectId)}
          />
          {order.company ? (
            <InvoiceLinkedReadonlyField
              label="Company"
              entityKind="company"
              value={order.company.id}
              selectionLabel={order.company.name}
              icon={<Building2 size={12} />}
              onOpen={() => relations.openEntity('company', order.company!.id)}
            />
          ) : null}
          {order.contact && contactName ? (
            <InvoiceLinkedReadonlyField
              label="Contact"
              entityKind="contact"
              value={order.contact.id}
              selectionLabel={contactName}
              icon={<User size={12} />}
              onOpen={() => relations.openEntity('contact', order.contact!.id)}
            />
          ) : null}
          {dealId && order.deal && canViewDeal ? (
            <InvoiceLinkedReadonlyField
              label="Deal"
              entityKind="order"
              value={dealId}
              selectionLabel={order.deal.name?.trim() || order.deal.code}
              icon={<Handshake size={12} />}
              onOpen={() => setDealSheetOpen(true)}
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
