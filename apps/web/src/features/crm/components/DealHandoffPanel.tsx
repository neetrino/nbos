'use client';

import { useTranslations } from 'next-intl';
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
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Deal } from '@/lib/api/deals';
import {
  COMMERCIAL_DEAL_TYPES,
  HANDOFF_VISIBLE_DEAL_STATUSES,
} from '../constants/deal-handoff.constants';
import type { CrmTranslate } from '../i18n/crm-copy';

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
  return (deal.orders ?? []).some((order) =>
    (order.invoices ?? []).some((invoice) => invoice.moneyStatus === 'PAID'),
  );
}

function getReadinessItems(deal: Deal, t: CrmTranslate): ReadinessItem[] {
  const hasOfferProof = Boolean(
    (deal.linkedOfferAssetCount ?? 0) > 0 ||
    deal.offerLink ||
    deal.offerFileUrl ||
    deal.offerScreenshotUrl,
  );
  const hasContractProof = Boolean(
    (deal.linkedContractAssetCount ?? 0) > 0 || deal.contractFileUrl,
  );
  const hasInvoice = (deal.orders ?? []).some((order) => (order.invoices ?? []).length > 0);
  const isClassic = deal.paymentType === 'CLASSIC';

  return [
    {
      label: t('dealSheet.handoff.pmAssigned'),
      ready: Boolean(deal.pmId || deal.pm),
      hint:
        deal.type === 'MAINTENANCE'
          ? t('dealSheet.handoff.pmHintMaintenance')
          : t('dealSheet.handoff.pmHint'),
    },
    {
      label: t('dealSheet.handoff.deadline'),
      ready: Boolean(deal.deadline),
      hint:
        deal.type === 'MAINTENANCE'
          ? t('dealSheet.handoff.deadlineHintMaintenance')
          : t('dealSheet.handoff.deadlineHint'),
    },
    {
      label: t('dealSheet.handoff.offerFile'),
      ready: hasOfferProof,
      hint: t('dealSheet.handoff.offerHint'),
    },
    {
      label: t('dealSheet.handoff.contractFile'),
      ready: !isClassic || hasContractProof,
      hint: isClassic
        ? t('dealSheet.handoff.contractHint')
        : t('dealSheet.handoff.contractHintSubscription'),
    },
    {
      label: t('dealSheet.handoff.invoiceExists'),
      ready: hasInvoice,
      hint: t('dealSheet.handoff.invoiceHint'),
    },
    {
      label: t('dealSheet.handoff.paymentReceived'),
      ready: hasPaidInvoice(deal) || deal.wonMode === 'EXCEPTION_FREE',
      hint: t('dealSheet.handoff.paymentHint'),
    },
    {
      label: t('dealSheet.handoff.whatsappGroup'),
      ready:
        deal.whatsappGroupBinding?.status === 'ACTIVE' &&
        Boolean(deal.whatsappGroupBinding.groupChatId),
      hint:
        deal.whatsappGroupBinding?.status === 'FAILED'
          ? t('dealSheet.handoff.whatsappHintFailed')
          : t('dealSheet.handoff.whatsappHint'),
    },
    {
      label: t('dealSheet.handoff.projectLinked'),
      ready: Boolean(deal.projectId || deal.handoff?.project),
      hint: t('dealSheet.handoff.projectHint'),
    },
    {
      label: t('dealSheet.handoff.deliveryShell'),
      ready:
        Boolean(deal.handoff?.product) ||
        (deal.orders ?? []).some((order) => order.deliveryStartMode === 'EARLY_START'),
      hint: t('dealSheet.handoff.deliveryHint'),
    },
  ];
}

function shouldShowHandoffPanel(deal: Deal): boolean {
  const handoff = deal.handoff;
  if (deal.status === 'WON') return true;
  if ((deal.orders ?? []).some((order) => order.deliveryStartMode === 'EARLY_START')) return true;
  if (handoff?.project || handoff?.product || handoff?.subscriptions?.length) return true;
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
  const t = useTranslations('crm');
  const handoff = deal.handoff;
  const project = handoff?.project ?? null;
  const product = handoff?.product ?? null;
  const subscription = handoff?.subscriptions?.[0] ?? null;
  const maintenanceDeal = handoff?.maintenanceDeal ?? null;
  if (!shouldShowHandoffPanel(deal)) return null;

  const readinessItems = getReadinessItems(deal, t);
  const projectHref = project ? `/projects/${project.id}` : null;
  const productHref = project && product ? `/projects/${project.id}/products/${product.id}` : null;
  const subscriptionHref = subscription
    ? `/finance/subscriptions?search=${encodeURIComponent(getSubscriptionDisplayTitle(subscription))}`
    : null;

  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <ShieldCheck size={12} />
        {t('dealSheet.handoff.title')}
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
          <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
            {t('dealSheet.handoff.emptyProject')}
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
          <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
            {t('dealSheet.handoff.emptyProduct')}
          </p>
        )}

        {subscriptionHref ? (
          <Link
            href={subscriptionHref}
            className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <RefreshCw className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">
                {subscription ? getSubscriptionDisplayTitle(subscription) : ''}
              </span>
            </span>
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
            {t('dealSheet.handoff.emptySubscription')}
          </p>
        )}

        {maintenanceDeal ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => onOpenDeal?.(maintenanceDeal.id)}
          >
            <span className="truncate">
              {t('dealSheet.handoff.openMaintenance', { code: maintenanceDeal.code })}
            </span>
            <ExternalLink className="size-3.5" />
          </Button>
        ) : (
          deal.type === 'PRODUCT' && (
            <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
              {t('dealSheet.handoff.maintenancePending')}
            </p>
          )
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
          {t('dealSheet.handoff.readiness')}
        </p>
        {readinessItems.map((item) => (
          <ReadinessRow key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
