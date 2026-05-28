'use client';

import { useCallback, useState } from 'react';
import { ViewModeSwitch } from '@/components/shared';
import { BonusPoolsPageContent } from '@/features/finance/components/bonus/BonusPoolsPageContent';
import { UnitEconomicsDrilldownSheet } from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet';
import { UnitEconomicsExpensesTable } from '@/features/finance/components/unit-economics/UnitEconomicsExpensesTable';
import { UnitEconomicsOverviewTable } from '@/features/finance/components/unit-economics/UnitEconomicsOverviewTable';
import { UnitEconomicsProfitabilityTable } from '@/features/finance/components/unit-economics/UnitEconomicsProfitabilityTable';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

const UNIT_ECONOMICS_VIEWS = [
  { value: 'overview' as const, label: 'Overview' },
  { value: 'funding' as const, label: 'Funding / cash' },
  { value: 'expenses' as const, label: 'Expenses' },
  { value: 'profitability' as const, label: 'Profitability' },
  { value: 'bonus-pools' as const, label: 'Bonus pools' },
];

type UnitEconomicsView = (typeof UNIT_ECONOMICS_VIEWS)[number]['value'];

/** Unit economics workspace — delivery unit financial state and bonus pool drill-down. */
export function UnitEconomicsPageContent() {
  const [view, setView] = useState<UnitEconomicsView>('overview');
  const [drilldownOrderId, setDrilldownOrderId] = useState<string | null>(null);
  const [drilldownFocus, setDrilldownFocus] = useState<UnitEconomicsDrilldownFocus>('invoices');
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  const onDrilldown = useCallback((orderId: string, focus: UnitEconomicsDrilldownFocus) => {
    setDrilldownOrderId(orderId);
    setDrilldownFocus(focus);
    setDrilldownOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Financial state per delivery product or extension: received funds, expenses, bonuses,
        available cash, and margin indicators. Click invoiced or received amounts to drill down.
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
      {view === 'funding' ? (
        <UnitEconomicsOverviewTable variant="funding" onDrilldown={onDrilldown} />
      ) : null}
      {view === 'expenses' ? <UnitEconomicsExpensesTable onDrilldown={onDrilldown} /> : null}
      {view === 'profitability' ? (
        <UnitEconomicsProfitabilityTable onDrilldown={onDrilldown} />
      ) : null}
      {view === 'bonus-pools' ? (
        <BonusPoolsPageContent documentTitle="Unit economics — bonus pools" />
      ) : null}

      <UnitEconomicsDrilldownSheet
        orderId={drilldownOrderId}
        focus={drilldownFocus}
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
      />
    </div>
  );
}
