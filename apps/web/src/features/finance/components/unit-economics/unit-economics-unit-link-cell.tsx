'use client';

import { unitEconomicsOrderTypeLabel } from '@/features/finance/components/unit-economics/unit-economics-order-type-label';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

export function UnitEconomicsUnitLinkCell({
  row,
  onDrilldown: _onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
  const typeLabel = unitEconomicsOrderTypeLabel(row.orderType);

  return (
    <td className="border-border border-b px-3 py-2">
      <span className="font-medium tabular-nums">{row.orderCode}</span>
      <p className="text-muted-foreground truncate text-[11px]">
        {row.label} · {typeLabel} · {row.projectCode} · {row.deliveryOpen ? 'open' : 'closed'}
      </p>
    </td>
  );
}
