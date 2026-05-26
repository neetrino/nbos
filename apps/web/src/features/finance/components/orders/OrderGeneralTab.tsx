'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DollarSign, ExternalLink, FolderKanban, Handshake } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetSection,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
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
    day: '2-digit',
  }).format(new Date(value));
}

export function OrderGeneralTab({ order }: OrderGeneralTabProps) {
  const statusCfg = ORDER_STATUSES[order.status];
  const total = Number(order.amount ?? order.totalAmount ?? 0);
  const [orderOpen, setOrderOpen] = useState(true);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,52rem)_minmax(0,1fr)] xl:items-start xl:gap-6">
      <div className="flex max-w-[52rem] min-w-0 flex-col gap-4">
        <DetailSheetCollapsibleSection
          title="Order"
          icon={<DollarSign size={12} />}
          open={orderOpen}
          onOpenChange={setOrderOpen}
        >
          <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
            <InlineField label="Code" value={order.code} />
            <InlineField label="Title" value={getOrderDisplayTitle(order)} />
            <InlineField label="Type" value={order.type} />
            <InlineField label="Payment type" value={order.paymentType} />
            <InlineField label="Amount" value={formatAmount(total)} />
            <InlineField label="Currency" value={order.currency} />
            <InlineField label="Created" value={formatShortDate(order.createdAt)} />
            {statusCfg ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">Status</span>
                <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
              </div>
            ) : null}
          </div>
        </DetailSheetCollapsibleSection>
      </div>

      <OrderLinkedPanel order={order} />
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
