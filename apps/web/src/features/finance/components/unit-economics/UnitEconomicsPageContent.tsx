'use client';

import { useCallback, useState } from 'react';
import { ViewModeSwitch } from '@/components/shared';
import { ProductBonusPoolSheet } from '@/features/finance/components/bonus/product-bonus-pool-sheet';
import { UnitEconomicsDrilldownSheet } from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet';
import { useUnitEconomicsPoolSheet } from '@/features/finance/hooks/use-unit-economics-pool-sheet';
import { UnitEconomicsExpensesTable } from '@/features/finance/components/unit-economics/UnitEconomicsExpensesTable';
import { UnitEconomicsOverviewTable } from '@/features/finance/components/unit-economics/UnitEconomicsOverviewTable';
import { UnitEconomicsProfitabilityTable } from '@/features/finance/components/unit-economics/UnitEconomicsProfitabilityTable';
import { UnitEconomicsProjectTable } from '@/features/finance/components/unit-economics/UnitEconomicsProjectTable';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

const UNIT_ECONOMICS_VIEWS = [
  { value: 'overview' as const, label: 'By unit' },
  { value: 'projects' as const, label: 'By project' },
  { value: 'funding' as const, label: 'Cash' },
  { value: 'expenses' as const, label: 'Outflows' },
  { value: 'profitability' as const, label: 'Profitability' },
];

type UnitEconomicsView = (typeof UNIT_ECONOMICS_VIEWS)[number]['value'];

/** Operational finance per delivery unit — money in, money out, balance (bonuses are part of out). */
export function UnitEconomicsPageContent() {
  const [view, setView] = useState<UnitEconomicsView>('overview');
  const [drilldownOrderId, setDrilldownOrderId] = useState<string | null>(null);
  const [drilldownFocus, setDrilldownFocus] = useState<UnitEconomicsDrilldownFocus>('invoices');
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  const poolSheet = useUnitEconomicsPoolSheet();

  const onDrilldown = useCallback((orderId: string, focus: UnitEconomicsDrilldownFocus) => {
    setDrilldownOrderId(orderId);
    setDrilldownFocus(focus);
    setDrilldownOpen(true);
  }, []);

  const onOpenPoolDetail = useCallback(
    (orderId: string) => {
      void poolSheet.openForOrder(orderId);
    },
    [poolSheet],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Financial state per delivery unit: money received and still expected, factual spend and
        bonus obligations, cash balance and margin. Bonuses are one part of outflows — not a
        separate product area. Click amounts to drill down.
      </p>
      <ViewModeSwitch
        value={view}
        options={UNIT_ECONOMICS_VIEWS}
        onChange={setView}
        ariaLabel="Unit economics view"
      />
      {view === 'overview' ? (
        <UnitEconomicsOverviewTable variant="overview" onDrilldown={onDrilldown} />
      ) : null}
      {view === 'projects' ? <UnitEconomicsProjectTable /> : null}
      {view === 'funding' ? (
        <UnitEconomicsOverviewTable variant="funding" onDrilldown={onDrilldown} />
      ) : null}
      {view === 'expenses' ? <UnitEconomicsExpensesTable onDrilldown={onDrilldown} /> : null}
      {view === 'profitability' ? (
        <UnitEconomicsProfitabilityTable onDrilldown={onDrilldown} />
      ) : null}

      <UnitEconomicsDrilldownSheet
        orderId={drilldownOrderId}
        focus={drilldownFocus}
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        onOpenPoolDetail={onOpenPoolDetail}
      />

      <ProductBonusPoolSheet
        pool={poolSheet.pool}
        open={poolSheet.open}
        onOpenChange={poolSheet.handleOpenChange}
        onPoolsRefresh={() => void poolSheet.refreshPools()}
      />
      {poolSheet.error && poolSheet.open && !poolSheet.pool ? (
        <p className="text-destructive text-sm">{poolSheet.error}</p>
      ) : null}
    </div>
  );
}
