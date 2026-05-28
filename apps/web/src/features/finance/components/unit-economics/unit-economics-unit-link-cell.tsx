'use client';

import Link from 'next/link';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

export function UnitEconomicsUnitLinkCell({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
  const label = onDrilldown ? (
    <button
      type="button"
      className="hover:text-primary text-left font-medium"
      onClick={() => onDrilldown(row.orderId, 'invoices')}
    >
      {row.label}
    </button>
  ) : (
    <Link
      href={`/finance/orders?search=${encodeURIComponent(row.orderCode)}`}
      className="hover:text-primary font-medium"
    >
      {row.label}
    </Link>
  );

  return (
    <td className="border-border border-b px-3 py-2">
      {label}
      <p className="text-muted-foreground text-[11px]">
        {row.orderCode} · {row.projectCode}
        {row.orderType ? ` · ${row.orderType}` : ''}
        {row.deliveryOpen ? ' · open' : ' · closed'}
      </p>
    </td>
  );
}
