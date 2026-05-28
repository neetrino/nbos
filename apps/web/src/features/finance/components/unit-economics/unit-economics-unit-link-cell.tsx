'use client';

import Link from 'next/link';
import { unitEconomicsOrderTypeLabel } from '@/features/finance/components/unit-economics/unit-economics-order-type-label';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

export function UnitEconomicsUnitLinkCell({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
  const typeLabel = unitEconomicsOrderTypeLabel(row.orderType);
  const title = onDrilldown ? (
    <button
      type="button"
      className="hover:text-primary text-left font-medium tabular-nums"
      onClick={() => onDrilldown(row.orderId, 'invoices')}
    >
      {row.orderCode}
    </button>
  ) : (
    <Link
      href={`/finance/orders?search=${encodeURIComponent(row.orderCode)}`}
      className="hover:text-primary font-medium tabular-nums"
    >
      {row.orderCode}
    </Link>
  );

  return (
    <td className="border-border border-b px-3 py-2">
      {title}
      <p className="text-muted-foreground truncate text-[11px]">
        {row.label} · {typeLabel} · {row.projectCode} · {row.deliveryOpen ? 'open' : 'closed'}
      </p>
    </td>
  );
}
