'use client';

import { type FormEvent, useState } from 'react';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type AddExpensePaymentPayload, type Expense } from '@/lib/api/finance';

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddExpensePaymentDialogProps {
  expenseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: (expense: Expense) => void;
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
}: AddExpensePaymentDialogProps) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayDateInputValue());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = parseFloat(amount.replace(/\s/g, ''));
  const canSubmit = Boolean(Number.isFinite(parsed) && parsed > 0 && paymentDate.trim());

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
    </CreateFormDialog>
  );
}

async function submitExpensePayment(options: {
  event: FormEvent;
  canSubmit: boolean;
  parsed: number;
  paymentDate: string;
  notes: string;
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
    };
    options.onRecorded(await expensesApi.addPayment(options.expenseId, payload));
    options.onOpenChange(false);
  } catch (caught) {
    options.setError(getApiErrorMessage(caught, options.fallbackError));
  } finally {
    options.setLoading(false);
  }
}
