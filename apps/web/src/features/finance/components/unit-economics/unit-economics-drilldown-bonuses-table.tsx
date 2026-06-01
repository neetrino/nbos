'use client';

import Link from 'next/link';
import { bonusEntryHref } from '@/features/finance/constants/bonus-board-url';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsOrderDetail } from '@/lib/api/unit-economics';

export function UnitEconomicsDrilldownBonusesTable({
  detail,
}: {
  detail: UnitEconomicsOrderDetail;
}) {
  if (detail.bonuses.length === 0) {
    return <p className="text-muted-foreground text-sm">No bonus entries on this unit.</p>;
  }
  return (
    <div className="border-border overflow-auto rounded-xl border">
      <table className="w-full min-w-[36rem] border-collapse text-xs">
        <thead className="bg-muted/40">
          <tr className="text-muted-foreground text-left">
            <th className="border-border border-b px-3 py-2 font-semibold">Employee</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Full</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Payable</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Released</th>
            <th className="border-border border-b px-2 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {detail.bonuses.map((line) => (
            <tr key={line.bonusEntryId} className="hover:bg-muted/30">
              <td className="border-border border-b px-3 py-2">
                <Link
                  href={bonusEntryHref(detail.projectId, line.bonusEntryId)}
                  className="hover:text-primary font-medium"
                >
                  {line.employeeName}
                </Link>
                <p className="text-muted-foreground text-[11px]">
                  {line.type}
                  {line.title ? ` · ${line.title}` : ''}
                  {line.earnedPeriod ? ` · ${line.earnedPeriod}` : ''}
                </p>
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(Number.parseFloat(line.fullAmount))}
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(Number.parseFloat(line.payableAmount))}
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(Number.parseFloat(line.releasedAmount))}
              </td>
              <td className="border-border border-b px-2 py-2">
                <span className="font-medium">{line.status}</span>
                <p className="text-muted-foreground text-[11px]">
                  Paid {formatAmount(Number.parseFloat(line.paidAmount))}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
