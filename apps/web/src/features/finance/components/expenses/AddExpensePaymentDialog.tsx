'use client';

import { type FormEvent, useState } from 'react';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type AddExpensePaymentPayload, type Expense } from '@/lib/api/finance';
import {
  planExpenseBonusAssignments,
  type ExpenseBonusDraft,
} from '@/features/finance/components/expenses/expense-payment-bonus-assignment';
import {
  ExpensePaymentBonusFields,
  type ExpensePaymentBonusRow,
} from '@/features/finance/components/expenses/ExpensePaymentBonusFields';

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ExpensePaymentPayrollCash = {
  salaryRemaining: string;
  carryRemaining: string;
  bonuses: ExpensePaymentBonusRow[];
};

interface AddExpensePaymentDialogProps {
  expenseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: (expense: Expense) => void;
  payrollCash?: ExpensePaymentPayrollCash | null;
}

export function AddExpensePaymentDialog(props: AddExpensePaymentDialogProps) {
  return (
    <AddExpensePaymentDialogSession key={props.open ? props.expenseId : 'closed'} {...props} />
  );
}

function AddExpensePaymentDialogSession({
  expenseId,
  open,
  onOpenChange,
  onRecorded,
  payrollCash = null,
}: AddExpensePaymentDialogProps) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayDateInputValue());
  const [notes, setNotes] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [carryDraft, setCarryDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = parseFloat(amount.replace(/\s/g, ''));
  const assignment = payrollCash
    ? planExpenseBonusAssignments({
        amountText: amount,
        salaryRemaining: payrollCash.salaryRemaining,
        carryRemaining: payrollCash.carryRemaining,
        bonuses: payrollCash.bonuses,
        drafts: bonusDrafts(payrollCash.bonuses, drafts),
        carryDraft,
      })
    : null;
  const canSubmit = Boolean(
    Number.isFinite(parsed) &&
    parsed > 0 &&
    paymentDate.trim() &&
    (assignment == null || assignment.valid),
  );

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('dialogs.addPaymentTitle')}
      error={error}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={t('actions.recordPayment')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop
      onSubmit={(event) =>
        void submitExpensePayment({
          event,
          canSubmit,
          parsed,
          paymentDate,
          notes,
          bonusAssignments: assignment?.bonusAssignments,
          carryAmount: assignment?.carryAmount,
          expenseId,
          setLoading,
          setError,
          onRecorded,
          onOpenChange,
          fallbackError: t('errors.recordPayment'),
        })
      }
    >
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('payments.amountRequired')}
          type="money"
          value={amount}
          placeholder="0.00"
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={setAmount}
        />
        <InlineField
          variant="controlled"
          label={t('payments.dateRequired')}
          type="date"
          value={paymentDate}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={setPaymentDate}
        />
      </FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('payments.notes')}
        type="textarea"
        value={notes}
        placeholder={t('payments.notesOptional')}
        onValueChange={setNotes}
      />
      {payrollCash && assignment ? (
        <ExpensePaymentBonusFields
          bonuses={payrollCash.bonuses}
          drafts={drafts}
          plan={assignment}
          carryDraft={carryDraft}
          onCarryDraftChange={setCarryDraft}
          disabled={loading}
          onDraftChange={(bonusReleaseId, amountText) =>
            setDrafts((current) => ({ ...current, [bonusReleaseId]: amountText }))
          }
        />
      ) : null}
    </CreateFormDialog>
  );
}

async function submitExpensePayment(options: {
  event: FormEvent;
  canSubmit: boolean;
  parsed: number;
  paymentDate: string;
  notes: string;
  bonusAssignments?: { bonusReleaseId: string; amount: string }[];
  carryAmount?: string;
  expenseId: string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onRecorded: (expense: Expense) => void;
  onOpenChange: (open: boolean) => void;
  fallbackError: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  options.setError(null);
  try {
    const payload: AddExpensePaymentPayload = {
      amount: options.parsed,
      paymentDate: new Date(`${options.paymentDate.trim()}T12:00:00.000Z`).toISOString(),
      notes: options.notes.trim() ? options.notes.trim() : undefined,
      bonusAssignments:
        options.bonusAssignments && options.bonusAssignments.length > 0
          ? options.bonusAssignments
          : undefined,
      carryAmount: options.carryAmount,
    };
    options.onRecorded(await expensesApi.addPayment(options.expenseId, payload));
    options.onOpenChange(false);
  } catch (caught) {
    options.setError(getApiErrorMessage(caught, options.fallbackError));
  } finally {
    options.setLoading(false);
  }
}

function bonusDrafts(
  bonuses: ExpensePaymentBonusRow[],
  drafts: Record<string, string>,
): ExpenseBonusDraft[] {
  return bonuses.map((bonus) => ({
    bonusReleaseId: bonus.bonusReleaseId,
    amountText: drafts[bonus.bonusReleaseId] ?? '',
  }));
}
