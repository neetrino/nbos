'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DollarSign, ExternalLink, FolderKanban, Handshake } from 'lucide-react';
import {
  DETAIL_SHEET_PAIRED_COLUMNS_CLASS,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetMetaDate,
  DetailSheetSection,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Order } from '@/lib/api/finance';
import { ORDER_STATUSES } from './order-statuses';

interface OrderGeneralTabProps {
  order: Order;
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function OrderGeneralTab({ order }: OrderGeneralTabProps) {
  const statusCfg = ORDER_STATUSES[order.status];
  const total = Number(order.amount ?? order.totalAmount ?? 0);
  const [orderOpen, setOrderOpen] = useState(true);

  return (
    <div className={DETAIL_SHEET_PAIRED_COLUMNS_CLASS}>
      <div className="flex min-w-0 flex-col gap-4">
        <DetailSheetCollapsibleSection
          title="Order"
          icon={<DollarSign size={12} />}
          titleTrailing={
            statusCfg ? (
              <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
            ) : undefined
          }
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
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <OrderLinkedPanel order={order} />
      </div>
    </div>
  );
}

function OrderLinkedPanel({ order }: { order: Order }) {
  return (
    <DetailSheetSection title="Linked">
      <div className="space-y-2 text-sm">
        <LinkRow
          icon={FolderKanban}
          value={order.project.name}
          href={`/projects/${order.projectId}`}
        />
        {order.company ? (
          <p className="text-muted-foreground">
            Company: <span className="text-foreground font-medium">{order.company.name}</span>
          </p>
        ) : null}
        {order.contact ? (
          <p className="text-muted-foreground">
            Contact:{' '}
            <span className="text-foreground font-medium">
              {order.contact.firstName} {order.contact.lastName}
            </span>
          </p>
        ) : null}
        {order.deal ? (
          <LinkRow
            icon={Handshake}
            value={getOrderDisplayTitle(order)}
            href={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(order.deal.id)}`}
          />
        ) : null}
      </div>
    </DetailSheetSection>
  );
}

function LinkRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof FolderKanban;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
    >
      <Icon size={14} aria-hidden />
      {value}
      <ExternalLink size={12} className="opacity-70" aria-hidden />
    </Link>
  );
}
