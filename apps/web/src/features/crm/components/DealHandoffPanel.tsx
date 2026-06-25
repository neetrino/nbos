'use client';

import Link from 'next/link';
import {
  Check,
  CircleDashed,
  ExternalLink,
  FolderKanban,
  Layers,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { Deal } from '@/lib/api/deals';
import {
  COMMERCIAL_DEAL_TYPES,
  HANDOFF_VISIBLE_DEAL_STATUSES,
} from '../constants/deal-handoff.constants';

interface DealHandoffPanelProps {
  deal: Deal;
  onOpenDeal?: (id: string) => void;
}

interface ReadinessItem {
  label: string;
  ready: boolean;
  hint: string;
}

function hasPaidInvoice(deal: Deal) {
  return deal.orders.some((order) =>
    order.invoices.some((invoice) => invoice.moneyStatus === 'PAID'),
  );
}

function getReadinessItems(deal: Deal): ReadinessItem[] {
  const hasOfferProof = Boolean(
    (deal.linkedOfferAssetCount ?? 0) > 0 ||
    deal.offerLink ||
    deal.offerFileUrl ||
    deal.offerScreenshotUrl,
  );
  const hasContractProof = Boolean(
    (deal.linkedContractAssetCount ?? 0) > 0 || deal.contractFileUrl,
  );
  const hasInvoice = deal.orders.some((order) => order.invoices.length > 0);
  const isClassic = deal.paymentType === 'CLASSIC';

  return [
    {
      label: 'PM assigned',
      ready: Boolean(deal.pmId || deal.pm),
      hint:
        deal.type === 'MAINTENANCE'
          ? 'Not required yet for maintenance'
          : 'Assign PM before delivery',
    },
    {
      label: 'Deadline',
      ready: Boolean(deal.deadline),
      hint:
        deal.type === 'MAINTENANCE'
          ? 'Maintenance start is tracked separately'
          : 'Set delivery deadline',
    },
    { label: 'Offer file', ready: hasOfferProof, hint: 'Attach offer in Drive (Offer section)' },
    {
      label: 'Contract file',
      ready: !isClassic || hasContractProof,
      hint: isClassic
        ? 'Attach contract in Drive (Contract section)'
        : 'Not required for subscription',
    },
    { label: 'Invoice exists', ready: hasInvoice, hint: 'Create invoice from Quick actions' },
    {
      label: 'Payment received',
      ready: hasPaidInvoice(deal) || deal.wonMode === 'EXCEPTION_FREE',
      hint: 'Finance should mark invoice as paid',
    },
    {
      label: 'Project linked',
      ready: Boolean(deal.projectId || deal.handoff?.project),
      hint: 'Link a project in Deal & project, or auto-created when delivery starts',
    },
    {
      label: 'Delivery shell',
      ready:
        Boolean(deal.handoff?.product) ||
        deal.orders.some((order) => order.deliveryStartMode === 'EARLY_START'),
      hint: 'Product or extension appears after Won or early delivery start',
    },
  ];
}

function shouldShowHandoffPanel(deal: Deal): boolean {
  const handoff = deal.handoff;
  if (deal.status === 'WON') return true;
  if (deal.orders.some((order) => order.deliveryStartMode === 'EARLY_START')) return true;
  if (handoff?.project || handoff?.product || handoff?.subscriptions.length) return true;
  if (handoff?.maintenanceDeal) return true;
  if (
    deal.type &&
    COMMERCIAL_DEAL_TYPES.has(deal.type) &&
    HANDOFF_VISIBLE_DEAL_STATUSES.has(deal.status)
  ) {
    return true;
  }
  return false;
}

function ReadinessRow({ item }: { item: ReadinessItem }) {
  return (
    <div className="border-border bg-background/60 flex items-start gap-2 rounded-lg border p-2">
      {item.ready ? (
        <Check className="text-foreground mt-0.5 size-3.5 shrink-0" />
      ) : (
        <CircleDashed className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-foreground text-xs font-semibold">{item.label}</p>
        {!item.ready && (
          <p className="text-muted-foreground text-[11px] leading-snug">{item.hint}</p>
        )}
      </div>
    </div>
  );
}

export function DealHandoffPanel({ deal, onOpenDeal }: DealHandoffPanelProps) {
  const handoff = deal.handoff;
  const project = handoff?.project ?? null;
  const product = handoff?.product ?? null;
  const subscription = handoff?.subscriptions[0] ?? null;
  const maintenanceDeal = handoff?.maintenanceDeal ?? null;
  if (!shouldShowHandoffPanel(deal)) return null;

  const readinessItems = getReadinessItems(deal);
  const projectHref = project ? `/projects/${project.id}` : null;
  const productHref = project && product ? `/projects/${project.id}/products/${product.id}` : null;
  const subscriptionHref = subscription
    ? `/finance/subscriptions?search=${encodeURIComponent(subscription.code)}`
    : null;

  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <ShieldCheck size={12} />
        Handoff
      </h4>

      <div className="space-y-2">
        {projectHref ? (
          <Link
            href={projectHref}
            className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FolderKanban className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{project?.name}</span>
            </span>
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed border-stone-200 px-3 py-2 text-xs dark:border-stone-700">
            Link a project in Deal &amp; project, or it will be created when delivery starts.
          </p>
        )}

        {productHref ? (
          <Link
            href={productHref}
            className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Layers className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{product?.name}</span>
            </span>
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed border-stone-200 px-3 py-2 text-xs dark:border-stone-700">
            Product link is missing or not applicable yet.
          </p>
        )}

        {subscriptionHref ? (
          <Link
            href={subscriptionHref}
            className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <RefreshCw className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{subscription?.code}</span>
            </span>
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed border-stone-200 px-3 py-2 text-xs dark:border-stone-700">
            Subscription link is missing or not applicable for this deal.
          </p>
        )}

        {maintenanceDeal ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => onOpenDeal?.(maintenanceDeal.id)}
          >
            <span className="truncate">Open {maintenanceDeal.code}</span>
            <ExternalLink className="size-3.5" />
          </Button>
        ) : (
          deal.type === 'PRODUCT' && (
            <p className="text-muted-foreground rounded-lg border border-dashed border-stone-200 px-3 py-2 text-xs dark:border-stone-700">
              Maintenance Deal is created after the Product handoff runs.
            </p>
          )
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
          Readiness
        </p>
        {readinessItems.map((item) => (
          <ReadinessRow key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
