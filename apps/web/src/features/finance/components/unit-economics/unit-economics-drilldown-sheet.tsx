'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  unitEconomicsApi,
  type UnitEconomicsDrilldownFocus,
  type UnitEconomicsOrderDetail,
} from '@/lib/api/unit-economics';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

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
}: {
  orderId: string | null;
  focus: UnitEconomicsDrilldownFocus;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onFocusChange?: (focus: UnitEconomicsDrilldownFocus) => void;
  onOpenPoolDetail?: (orderId: string) => void;
}) {
  const [tab, setTab] = useState<UnitEconomicsDrilldownFocus>(focus);
  const [detail, setDetail] = useState<UnitEconomicsOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTab(focus);
  }, [open, focus]);

  useEffect(() => {
    if (!open || !orderId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void unitEconomicsApi
      .orderDetail(orderId)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load unit detail.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  const tabs = useMemo(() => (detail ? buildUnitEconomicsDrilldownTabs(detail) : []), [detail]);

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
    orderId != null ? unitEconomicsDrilldownHref(orderId, tab) : '/finance/unit-economics';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                  {detail?.label ?? 'Delivery unit'}
                </h2>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {detail
                  ? `${detail.orderCode} · ${detail.projectCode} · ${detail.orderType}`
                  : 'Invoices, payments, expenses, and bonuses for the selected delivery unit.'}
              </p>
            </div>
          </div>
        </div>

        {detail ? (
          <DetailSheetTabBar tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {detail ? (
            <>
              <UnitEconomicsDrilldownSheetSummary
                detail={detail}
                onFocusChange={handleSummaryFocus}
              />
              <DrilldownTabPanel tab={tab} detail={detail} />
              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
                {onOpenPoolDetail ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPoolDetail(detail.orderId)}
                  >
                    Bonus breakdown
                  </Button>
                ) : null}
                <Link
                  href={`/finance/invoices?search=${encodeURIComponent(detail.orderCode)}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                  Invoices
                  <ExternalLink size={12} className="opacity-70" aria-hidden />
                </Link>
                <Link
                  href={bonusBoardHref(detail.projectId)}
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
