'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  getPartnerDirection,
  getPartnerLevel,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import {
  formatPartnerDateOnly,
  formatPartnerPercent,
} from '@/features/partners/utils/partner-detail-format';
import { partnerOrdersDrilldownHref } from '@/features/finance/constants/partner-orders-drilldown';
import { partnerSubscriptionsDrilldownHref } from '@/features/finance/constants/subscription-partner-drilldown';
import type { Partner } from '@/lib/api/partners';

export function PartnerOverviewTab(props: { partner: Partner }) {
  const { partner } = props;
  const tier = getPartnerLevel(partner.level);
  const dir = getPartnerDirection(partner.direction);
  const st = getPartnerStatus(partner.status);
  const orders = partner._count?.orders ?? 0;
  const subs = partner._count?.subscriptions ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Level</p>
          <div className="mt-2">
            {tier ? <StatusBadge label={tier.label} variant={tier.variant} /> : partner.level}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Direction</p>
          <div className="mt-2 flex items-center gap-1">
            {partner.direction === 'INBOUND' ? (
              <ArrowDownLeft size={14} className="text-green-500" />
            ) : partner.direction === 'OUTBOUND' ? (
              <ArrowUpRight size={14} className="text-blue-500" />
            ) : (
              <ArrowLeftRight size={14} className="text-purple-500" />
            )}
            {dir ? <StatusBadge label={dir.label} variant={dir.variant} /> : partner.direction}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Default %</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatPartnerPercent(partner.defaultPercent)}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Status</p>
          <div className="mt-2">
            {st ? <StatusBadge label={st.label} variant={st.variant} /> : partner.status}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Partner since</p>
          <p className="mt-2 text-sm font-medium">{formatPartnerDateOnly(partner.startDate)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Orders</p>
          <p className="mt-2 text-xl font-bold tabular-nums">
            {orders > 0 ? (
              <Link
                href={partnerOrdersDrilldownHref(partner.id)}
                className="text-primary hover:underline"
              >
                {orders}
              </Link>
            ) : (
              orders
            )}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Subscriptions</p>
          <p className="mt-2 text-xl font-bold tabular-nums">
            {subs > 0 ? (
              <Link
                href={partnerSubscriptionsDrilldownHref(partner.id)}
                className="text-primary hover:underline"
              >
                {subs}
              </Link>
            ) : (
              subs
            )}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Primary contact</p>
          <div className="mt-2 text-sm">
            {partner.contact ? (
              <div>
                <p className="font-medium">
                  {partner.contact.firstName} {partner.contact.lastName}
                </p>
                <p className="text-muted-foreground font-mono text-xs">{partner.contact.id}</p>
              </div>
            ) : partner.contactId ? (
              <span className="font-mono text-xs">{partner.contactId}</span>
            ) : (
              <span className="text-muted-foreground">None linked</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Notes</p>
        <p className="text-foreground mt-2 text-sm whitespace-pre-wrap">
          {partner.notes?.trim() ? (
            partner.notes
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </p>
      </div>
    </div>
  );
}
