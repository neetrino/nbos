'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
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
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type Expense, type ExpensePaymentEntry } from '@/lib/api/finance';
import {
  EXPENSE_GATE_FIELD_PAYMENTS,
  expenseStageGateSectionClass,
} from '@/features/finance/constants/expense-stage-gate-highlight';
import { DeleteExpensePaymentDialog } from './DeleteExpensePaymentDialog';

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
  onExpenseUpdated: (expense: Expense) => void;
  gateRequiredFields?: ReadonlySet<string>;
}

export function ExpenseDetailPaymentSection({
  expense,
  onExpenseUpdated,
  gateRequiredFields = new Set(),
}: ExpenseDetailPaymentSectionProps) {
  const [paymentToRemove, setPaymentToRemove] = useState<ExpensePaymentEntry | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;

  const paymentSummary =
    paymentToRemove !== null
      ? `${formatAmount(parseFloat(paymentToRemove.amount))} · ${formatPaymentDate(paymentToRemove.paymentDate)}`
      : '';

  const handleConfirmRemovePayment = async () => {
    if (!paymentToRemove) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const updated = await expensesApi.deletePayment(expense.id, paymentToRemove.id);
      onExpenseUpdated(updated);
      setPaymentToRemove(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, 'Payment could not be removed. Try again.'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div
      className={expenseStageGateSectionClass(
        gateRequiredFields,
        EXPENSE_GATE_FIELD_PAYMENTS,
        'flex flex-col gap-4',
      )}
    >
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
                  <TableHead className="w-[52px] text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expense.payments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatPaymentDate(row.paymentDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(parseFloat(row.amount))}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {row.notes ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove payment ${formatAmount(parseFloat(row.amount))}`}
                        onClick={() => {
                          setDeleteError(null);
                          setPaymentToRemove(row);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : null}

      <DeleteExpensePaymentDialog
        paymentSummary={paymentSummary}
        open={paymentToRemove !== null}
        isSubmitting={deleteSubmitting}
        errorMessage={deleteError}
        onOpenChange={(next) => {
          if (!next) {
            setPaymentToRemove(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmRemovePayment}
      />
    </div>
  );
}
