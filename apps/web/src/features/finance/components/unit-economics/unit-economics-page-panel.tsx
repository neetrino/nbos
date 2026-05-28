'use client';

import type { UnitEconomicsBoardViewMode } from '@/features/finance/constants/unit-economics-board-view';
import { UnitEconomicsExpensesTable } from '@/features/finance/components/unit-economics/UnitEconomicsExpensesTable';
import { UnitEconomicsOverviewTable } from '@/features/finance/components/unit-economics/UnitEconomicsOverviewTable';
import { UnitEconomicsProfitabilityTable } from '@/features/finance/components/unit-economics/UnitEconomicsProfitabilityTable';
import { UnitEconomicsProductTable } from '@/features/finance/components/unit-economics/UnitEconomicsProductTable';
import { UnitEconomicsProjectTable } from '@/features/finance/components/unit-economics/UnitEconomicsProjectTable';
import { UnitEconomicsUnitCards } from '@/features/finance/components/unit-economics/UnitEconomicsUnitCards';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { UnitEconomicsTotalsBar } from '@/features/finance/components/unit-economics/unit-economics-totals-bar';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

type UnitEconomicsPagePanelProps = {
  view: UnitEconomicsBoardViewMode;
  data: UnitEconomicsBoardData;
  filteredItems: UnitEconomicsRow[];
  onDrilldown: DrilldownHandler;
};

export function UnitEconomicsPagePanel({
  view,
  data,
  filteredItems,
  onDrilldown,
}: UnitEconomicsPagePanelProps) {
  const totalsBar = data.totals ? <UnitEconomicsTotalsBar totals={data.totals} /> : null;

  switch (view) {
    case 'cards':
      return (
        <div className="flex flex-col gap-3">
          {totalsBar}
          <UnitEconomicsUnitCards items={filteredItems} onDrilldown={onDrilldown} />
        </div>
      );
    case 'projects':
      return <UnitEconomicsProjectTable data={data} />;
    case 'products':
      return <UnitEconomicsProductTable data={data} />;
    case 'cash':
      return (
        <UnitEconomicsOverviewTable
          data={data}
          items={filteredItems}
          variant="funding"
          onDrilldown={onDrilldown}
        />
      );
    case 'outflows':
      return (
        <UnitEconomicsExpensesTable data={data} items={filteredItems} onDrilldown={onDrilldown} />
      );
    case 'profitability':
      return (
        <UnitEconomicsProfitabilityTable
          data={data}
          items={filteredItems}
          onDrilldown={onDrilldown}
        />
      );
    default:
      return (
        <UnitEconomicsOverviewTable
          data={data}
          items={filteredItems}
          variant="overview"
          onDrilldown={onDrilldown}
        />
      );
  }
}
