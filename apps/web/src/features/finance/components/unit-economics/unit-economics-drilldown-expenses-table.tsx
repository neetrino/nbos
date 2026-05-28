'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsOrderDetail } from '@/lib/api/unit-economics';

export function UnitEconomicsDrilldownExpensesTable({
  detail,
}: {
  detail: UnitEconomicsOrderDetail;
}) {
  if (detail.expenses.length === 0) {
    return <p className="text-muted-foreground text-sm">No expenses booked to this unit.</p>;
  }
  return (
    <div className="border-border overflow-auto rounded-xl border">
      <table className="w-full min-w-[32rem] border-collapse text-xs">
        <thead className="bg-muted/40">
          <tr className="text-muted-foreground text-left">
            <th className="border-border border-b px-3 py-2 font-semibold">Expense</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Amount</th>
            <th className="border-border border-b px-2 py-2 font-semibold">Booked</th>
          </tr>
        </thead>
        <tbody>
          {detail.expenses.map((line) => (
            <tr key={line.journalEntryId} className="hover:bg-muted/30">
              <td className="border-border border-b px-3 py-2">
                <Link
                  href={`/finance/expenses/${line.expenseId}`}
                  className="hover:text-primary font-medium"
                >
                  {line.name}
                </Link>
                <p className="text-muted-foreground text-[11px]">{line.sourceType}</p>
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(Number.parseFloat(line.amount))}
              </td>
              <td className="border-border border-b px-2 py-2">
                {new Date(line.bookedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
