'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, PieChart } from 'lucide-react';
import { DetailSheetTabBar, EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { UnitEconomicsDrilldownBonusesTable } from '@/features/finance/components/unit-economics/unit-economics-drilldown-bonuses-table';
import { UnitEconomicsDrilldownExpensesTable } from '@/features/finance/components/unit-economics/unit-economics-drilldown-expenses-table';
import { UnitEconomicsDrilldownSheetSummary } from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet-summary';
import {
  UnitEconomicsDrilldownInvoicesTable,
  UnitEconomicsDrilldownPaymentsTable,
} from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet-tables';
import { buildUnitEconomicsDrilldownTabs } from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet-tabs';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { unitEconomicsDrilldownHref } from '@/features/finance/constants/unit-economics-drilldown-url';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import {
  unitEconomicsApi,
  type UnitEconomicsDrilldownFocus,
  type UnitEconomicsOrderDetail,
} from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type HydratedUnitEconomicsDetail = UnitEconomicsOrderDetail & { id: string };

function withDetailId(detail: UnitEconomicsOrderDetail): HydratedUnitEconomicsDetail {
  return { ...detail, id: detail.orderId };
}

function DrilldownTabPanel({
  tab,
  detail,
}: {
  tab: UnitEconomicsDrilldownFocus;
  detail: UnitEconomicsOrderDetail;
}) {
  if (tab === 'invoices') return <UnitEconomicsDrilldownInvoicesTable detail={detail} />;
  if (tab === 'payments') return <UnitEconomicsDrilldownPaymentsTable detail={detail} />;
  if (tab === 'expenses') return <UnitEconomicsDrilldownExpensesTable detail={detail} />;
  return <UnitEconomicsDrilldownBonusesTable detail={detail} />;
}

export function UnitEconomicsDrilldownSheet({
  orderId,
  focus,
  open,
  onOpenChange,
  onFocusChange,
  onOpenPoolDetail,
  initialOrderDetail = null,
}: {
  orderId: string | null;
  focus: UnitEconomicsDrilldownFocus;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onFocusChange?: (focus: UnitEconomicsDrilldownFocus) => void;
  onOpenPoolDetail?: (orderId: string) => void;
  /** Table-row seed for instant header/summary while order detail hydrates. */
  initialOrderDetail?: UnitEconomicsOrderDetail | null;
}) {
  const [tab, setTab] = useState<UnitEconomicsDrilldownFocus>(focus);
  const activeTab = open ? focus : tab;
  const loadOrderId = open && orderId ? orderId : '';

  const initialEntity = useMemo(() => {
    if (!initialOrderDetail || initialOrderDetail.orderId !== loadOrderId) return null;
    return withDetailId(initialOrderDetail);
  }, [initialOrderDetail, loadOrderId]);

  const { entity, loading, hydrating, error } = useEntityDetailHydration({
    entityId: loadOrderId,
    open: Boolean(loadOrderId),
    initialEntity,
    fetchById: async (id) => withDetailId(await unitEconomicsApi.orderDetail(id)),
    loadErrorMessage: 'Could not load unit detail.',
  });

  const displayedDetail = entity;
  const displayedError = loadOrderId ? error : null;
  const displayedLoading = Boolean(loadOrderId) && loading;
  const detailHasLineItems = Boolean(
    displayedDetail &&
    (displayedDetail.invoices.length > 0 ||
      displayedDetail.payments.length > 0 ||
      displayedDetail.expenses.length > 0 ||
      displayedDetail.bonuses.length > 0),
  );
  const showLineItemsSkeleton = Boolean(displayedDetail && !detailHasLineItems && hydrating);

  const tabs = useMemo(
    () => (displayedDetail ? buildUnitEconomicsDrilldownTabs(displayedDetail) : []),
    [displayedDetail],
  );

  const handleTabChange = (value: string) => {
    const next = value as UnitEconomicsDrilldownFocus;
    setTab(next);
    onFocusChange?.(next);
  };

  const handleSummaryFocus = (next: UnitEconomicsDrilldownFocus) => {
    setTab(next);
    onFocusChange?.(next);
  };

  const sourcePageHref =
    orderId != null ? unitEconomicsDrilldownHref(orderId, activeTab) : '/finance/unit-economics';

  const handleOpenChange = (next: boolean) => {
    if (!next) setTab(focus);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="compact"
        sourcePageHref={sourcePageHref}
        className="gap-0 p-0"
      >
        <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                <PieChart className="text-muted-foreground size-5 shrink-0" aria-hidden />
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {displayedDetail?.label ?? 'Delivery unit'}
                </h2>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {displayedDetail
                  ? `${displayedDetail.orderCode} · ${displayedDetail.projectCode} · ${displayedDetail.orderType}`
                  : 'Invoices, payments, expenses, and bonuses for the selected delivery unit.'}
              </p>
            </div>
          </div>
        </div>

        {displayedDetail ? (
          <DetailSheetTabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {displayedLoading && !displayedDetail ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : null}
          {displayedError ? <p className="text-destructive text-sm">{displayedError}</p> : null}
          {displayedDetail ? (
            <>
              <UnitEconomicsDrilldownSheetSummary
                detail={displayedDetail}
                onFocusChange={handleSummaryFocus}
              />
              {detailHasLineItems ? (
                <DrilldownTabPanel tab={activeTab} detail={displayedDetail} />
              ) : showLineItemsSkeleton ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading line items…
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
                {onOpenPoolDetail ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPoolDetail(displayedDetail.orderId)}
                  >
                    Bonus breakdown
                  </Button>
                ) : null}
                <Link
                  href={`/finance/invoices?search=${encodeURIComponent(displayedDetail.orderCode)}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                  Invoices
                  <ExternalLink size={12} className="opacity-70" aria-hidden />
                </Link>
                <Link
                  href={bonusBoardHref(displayedDetail.projectId)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                  Bonus board
                  <ExternalLink size={12} className="opacity-70" aria-hidden />
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
