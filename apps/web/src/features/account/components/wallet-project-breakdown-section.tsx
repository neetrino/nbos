'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import { WALLET_PROJECT_PAYOUT_EXPLANATION } from '@/features/finance/constants/employee-wallet-explanations';
import type { EmployeeWalletProjectBreakdownRow } from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function WalletProjectBreakdownSection({
  rows,
}: {
  rows: readonly EmployeeWalletProjectBreakdownRow[];
}) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Project breakdown</h2>
      <p className="text-muted-foreground mb-3 text-xs leading-snug">
        Per-order roll-up with product pool funding (read-only). Payout column explains unpaid,
        partial, or paid bonus on your entries.
      </p>
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Product scope</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Funding</TableHead>
              <TableHead>Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center text-sm">
                  No bonus orders yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.orderId}>
                  <TableCell>
                    <Link
                      href={`/projects/${row.projectId}`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {row.project.code}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{row.order.code}</TableCell>
                  <TableCell className="max-w-[12rem] text-xs">{row.productLabel}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.plannedBonus))}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.paidBonus))}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.remainingBonus))}
                  </TableCell>
                  <TableCell className="max-w-[12rem] text-[11px] leading-snug">
                    {row.fundingStatusLabels.join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="max-w-[10rem] text-[11px] leading-snug">
                    <span className="text-foreground font-medium">{row.payoutState}</span>
                    <p className="text-muted-foreground mt-0.5">
                      {WALLET_PROJECT_PAYOUT_EXPLANATION[row.payoutState]}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
