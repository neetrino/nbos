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
import type { Deal } from '@/lib/api/deals';

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
  return deal.orders.some((order) => order.invoices.some((invoice) => invoice.status === 'PAID'));
}

function getReadinessItems(deal: Deal): ReadinessItem[] {
  const hasOfferProof = Boolean(
    deal.offerSentAt && (deal.offerLink || deal.offerFileUrl || deal.offerScreenshotUrl),
  );
  const hasContractProof = Boolean(deal.contractSignedAt || deal.contractFileUrl);
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
    { label: 'Offer proof', ready: hasOfferProof, hint: 'Add sent date and offer link/file' },
    {
      label: 'Contract proof',
      ready: !isClassic || hasContractProof,
      hint: isClassic ? 'Attach signed contract proof' : 'Not required for subscription payment',
    },
    { label: 'Invoice exists', ready: hasInvoice, hint: 'Create invoice from Actions' },
    {
      label: 'Payment received',
      ready: hasPaidInvoice(deal),
      hint: 'Finance should mark invoice as paid',
    },
    {
      label: 'Project/Product link',
      ready: Boolean(deal.handoff?.project || deal.projectId) && Boolean(deal.handoff?.product),
      hint: 'Created after Deal Won handoff',
    },
  ];
}

function ReadinessRow({ item }: { item: ReadinessItem }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-stone-100 bg-white/60 p-2 dark:border-stone-800 dark:bg-stone-900/20">
      {item.ready ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
  const showPanel =
    deal.status === 'WON' || Boolean(project || product || subscription || maintenanceDeal);

  if (!showPanel) return null;

  const readinessItems = getReadinessItems(deal);
  const projectHref = project ? `/projects/${project.id}` : null;
  const productHref = project && product ? `/projects/${project.id}/products/${product.id}` : null;
  const subscriptionHref = subscription
    ? `/finance/subscriptions?search=${encodeURIComponent(subscription.code)}`
    : null;

  return (
    <section className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/80 to-white p-4 dark:border-sky-800 dark:from-sky-950/20 dark:to-transparent">
      <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
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
              <FolderKanban className="size-3.5 shrink-0 text-sky-600" />
              <span className="truncate">{project?.name}</span>
            </span>
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed border-stone-200 px-3 py-2 text-xs dark:border-stone-700">
            Project will appear after Deal Won creates the delivery shell.
          </p>
        )}

        {productHref ? (
          <Link
            href={productHref}
            className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Layers className="size-3.5 shrink-0 text-violet-600" />
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
              <RefreshCw className="size-3.5 shrink-0 text-emerald-600" />
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
