'use client';

import Link from 'next/link';
import type { UnitEconomicsRow } from '@/lib/api/unit-economics';

export function UnitEconomicsUnitLinkCell({ row }: { row: UnitEconomicsRow }) {
  return (
    <td className="border-border border-b px-3 py-2">
      <Link
        href={`/finance/orders?search=${encodeURIComponent(row.orderCode)}`}
        className="hover:text-primary font-medium"
      >
        {row.label}
      </Link>
      <p className="text-muted-foreground text-[11px]">
        {row.orderCode} · {row.projectCode}
        {row.orderType ? ` · ${row.orderType}` : ''}
        {row.deliveryOpen ? ' · open' : ' · closed'}
      </p>
    </td>
  );
}
