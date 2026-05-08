'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowLeft, ArrowLeftRight, ArrowUpRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { EditPartnerDialog } from '@/features/partners/components/EditPartnerDialog';
import { PartnerAccrualsCard } from '@/features/partners/components/PartnerAccrualsCard';
import { PartnerCommissionPolicyCard } from '@/features/partners/components/PartnerCommissionPolicyCard';
import { PartnerOutboundServicesCard } from '@/features/partners/components/PartnerOutboundServicesCard';
import {
  getPartnerDirection,
  getPartnerStatus,
  getPartnerLevel,
} from '@/features/partners/constants/partners';
import { partnerOrdersDrilldownHref } from '@/features/finance/constants/partner-orders-drilldown';
import { partnerSubscriptionsDrilldownHref } from '@/features/finance/constants/subscription-partner-drilldown';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';

function formatPercent(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [accrualsReloadKey, setAccrualsReloadKey] = useState(0);

  const fetchPartner = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await partnersApi.getById(id);
      setPartner(data);
      setError(null);
      setAccrualsReloadKey((k) => k + 1);
    } catch (caught) {
      setPartner(null);
      setError(
        getApiErrorMessage(caught, 'Partner could not be loaded. It may have been removed.'),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href="/partners"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Back to partners"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Partner</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={fetchPartner} />
      </div>
    );
  }

  const tier = getPartnerLevel(partner.level);
  const dir = getPartnerDirection(partner.direction);
  const st = getPartnerStatus(partner.status);
  const orders = partner._count?.orders ?? 0;
  const subs = partner._count?.subscriptions ?? 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/partners"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label="Back to partners"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-semibold">{partner.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Created {formatDate(partner.createdAt)}
              {' · '}
              Updated {formatDate(partner.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Edit
          </Button>
        </div>
      </div>

      <EditPartnerDialog
        partner={partner}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => setPartner(updated)}
      />

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
            {formatPercent(partner.defaultPercent)}
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
      </div>

      <PartnerCommissionPolicyCard partnerId={partner.id} />

      <PartnerAccrualsCard partnerId={partner.id} reloadKey={accrualsReloadKey} />
      <PartnerOutboundServicesCard partnerId={partner.id} reloadKey={accrualsReloadKey} />

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
  );
}
