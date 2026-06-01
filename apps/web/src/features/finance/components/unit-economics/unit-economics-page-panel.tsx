'use client';

import type { UnitEconomicsBoardViewMode } from '@/features/finance/constants/unit-economics-board-view';
import { UnitEconomicsExpensesTable } from '@/features/finance/components/unit-economics/UnitEconomicsExpensesTable';
import { UnitEconomicsNestedTable } from '@/features/finance/components/unit-economics/UnitEconomicsNestedTable';
import { UnitEconomicsOverviewTable } from '@/features/finance/components/unit-economics/UnitEconomicsOverviewTable';
import { UnitEconomicsProfitabilityTable } from '@/features/finance/components/unit-economics/UnitEconomicsProfitabilityTable';
import { UnitEconomicsUnitCards } from '@/features/finance/components/unit-economics/UnitEconomicsUnitCards';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

type UnitEconomicsPagePanelProps = {
  view: UnitEconomicsBoardViewMode;
  data: UnitEconomicsBoardData;
  filteredItems: UnitEconomicsRow[];
  activeOrderId?: string | null;
  onDrilldown: DrilldownHandler;
};

export function UnitEconomicsPagePanel({
  view,
  data,
  filteredItems,
  activeOrderId = null,
  onDrilldown,
}: UnitEconomicsPagePanelProps) {
  switch (view) {
    case 'tree':
      return (
        <UnitEconomicsNestedTable
          data={data}
          items={filteredItems}
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
    case 'cards':
      return <UnitEconomicsUnitCards items={filteredItems} onDrilldown={onDrilldown} />;
    case 'orders':
      return (
        <UnitEconomicsOverviewTable
          data={data}
          items={filteredItems}
          variant="overview"
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
    case 'cash':
      return (
        <UnitEconomicsOverviewTable
          data={data}
          items={filteredItems}
          variant="funding"
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
    case 'outflows':
      return (
        <UnitEconomicsExpensesTable
          data={data}
          items={filteredItems}
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
    case 'profitability':
      return (
        <UnitEconomicsProfitabilityTable
          data={data}
          items={filteredItems}
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
    default:
      return (
        <UnitEconomicsNestedTable
          data={data}
          items={filteredItems}
          activeOrderId={activeOrderId}
          onDrilldown={onDrilldown}
        />
      );
  }
}
