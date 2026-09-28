'use client';

import { useState } from 'react';
import { Trash2, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSection, StatusBadge } from '@/components/shared';
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
import {
  isOriginalPayrollCashPayment,
  visibleFinanceNote,
} from '@/features/finance/utils/visible-finance-note';
import { DeleteExpensePaymentDialog } from './DeleteExpensePaymentDialog';
import {
  RefundExpensePaymentDialog,
  type ExpensePaymentRefundInput,
} from './RefundExpensePaymentDialog';
import { translateExpensePaymentStatus } from './expense-i18n-labels';

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
  const t = useTranslations('expenses');
  const [paymentToRemove, setPaymentToRemove] = useState<ExpensePaymentEntry | null>(null);
  const [paymentToRefund, setPaymentToRefund] = useState<ExpensePaymentEntry | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;

  const paymentSummary =
    paymentToRemove !== null
      ? `${formatAmount(parseFloat(paymentToRemove.amount))} · ${formatPaymentDate(paymentToRemove.paymentDate)}`
      : '';

  const handleConfirmRefund = async (input: ExpensePaymentRefundInput) => {
    if (!paymentToRefund) return;
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const updated = await expensesApi.refundPayment(expense.id, paymentToRefund.id, input);
      onExpenseUpdated(updated);
      setPaymentToRefund(null);
    } catch (caught) {
      setRefundError(getApiErrorMessage(caught, t('errors.refundPayment')));
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleConfirmRemovePayment = async () => {
    if (!paymentToRemove) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const updated = await expensesApi.deletePayment(expense.id, paymentToRemove.id);
      onExpenseUpdated(updated);
      setPaymentToRemove(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, t('errors.removePayment')));
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
      {expense.paidAmount !== undefined &&
      expense.remainingAmount !== undefined &&
      ledgerPresentation ? (
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs tabular-nums">
          <span>
            {formatAmount(parseFloat(expense.paidAmount))} /{' '}
            {formatAmount(parseFloat(expense.remainingAmount!))}
          </span>
          <StatusBadge
            label={translateExpensePaymentStatus(expense.paymentStatus!, t)}
            variant={ledgerPresentation.variant}
          />
        </p>
      ) : null}

      {expense.payments !== undefined ? (
        <DetailSheetSection title={t('sheet.sections.paymentHistory')} outlined>
          {expense.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('payments.empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payments.date')}</TableHead>
                  <TableHead className="text-right">{t('payments.amount')}</TableHead>
                  <TableHead>{t('payments.notes')}</TableHead>
                  <TableHead className="w-[88px] text-right">
                    <span className="sr-only">{t('payments.actions')}</span>
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
                      {visibleFinanceNote(row.notes) ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <PaymentRowActions
                        row={row}
                        onRefund={() => {
                          setRefundError(null);
                          setPaymentToRefund(row);
                        }}
                        onRemove={() => {
                          setDeleteError(null);
                          setPaymentToRemove(row);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DetailSheetSection>
      ) : null}

      <RefundExpensePaymentDialog
        open={paymentToRefund !== null}
        isSubmitting={refundSubmitting}
        errorMessage={refundError}
        onOpenChange={(next) => {
          if (!next) {
            setPaymentToRefund(null);
            setRefundError(null);
          }
        }}
        onConfirm={handleConfirmRefund}
      />
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

function PaymentRowActions(props: {
  row: ExpensePaymentEntry;
  onRefund: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations('expenses');
  const amount = formatAmount(parseFloat(props.row.amount));
  return (
    <div className="flex justify-end gap-1">
      {isOriginalPayrollCashPayment(props.row.notes) ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={t('payments.refundAria', { amount })}
          onClick={props.onRefund}
        >
          <Undo2 size={14} />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-destructive"
        aria-label={t('payments.removeAria', { amount })}
        onClick={props.onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
