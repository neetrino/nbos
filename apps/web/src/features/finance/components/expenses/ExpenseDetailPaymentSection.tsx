'use client';

import { StatusBadge } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Expense } from '@/lib/api/finance';

function formatPaymentDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ExpenseDetailPaymentSectionProps {
  expense: Expense;
}

export function ExpenseDetailPaymentSection({ expense }: ExpenseDetailPaymentSectionProps) {
  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;

  return (
    <>
      {expense.paidAmount !== undefined && expense.remainingAmount !== undefined ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Paid amount</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatAmount(parseFloat(expense.paidAmount))}
            </p>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Remaining</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatAmount(parseFloat(expense.remainingAmount))}
            </p>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Payment status</p>
            <div className="mt-2">
              {ledgerPresentation ? (
                <StatusBadge
                  label={ledgerPresentation.label}
                  variant={ledgerPresentation.variant}
                />
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      ) : null}

      {expense.payments !== undefined ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Payment history
          </p>
          {expense.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expense.payments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatPaymentDate(row.paymentDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseFloat(row.amount))}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[240px] truncate">
                      {row.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : null}
    </>
  );
}
