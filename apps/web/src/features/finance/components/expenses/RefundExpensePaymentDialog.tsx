'use client';

import { type FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ExpensePaymentRefundInput = {
  amount: number;
  paymentDate: string;
  reason: string;
};

export function RefundExpensePaymentDialog(props: {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ExpensePaymentRefundInput) => void | Promise<void>;
}) {
  return <RefundExpensePaymentDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function RefundExpensePaymentDialogSession({
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ExpensePaymentRefundInput) => void | Promise<void>;
}) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayDateInputValue);
  const [reason, setReason] = useState('');
  const parsed = parseFloat(amount.replace(/\s/g, ''));
  const canSubmit = Number.isFinite(parsed) && parsed > 0 && paymentDate.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    void onConfirm({
      amount: parsed,
      paymentDate: new Date(`${paymentDate.trim()}T12:00:00.000Z`).toISOString(),
      reason: reason.trim(),
    });
  };

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('dialogs.refundPaymentTitle')}
      description={t('dialogs.refundPaymentDescription')}
      error={errorMessage}
      submitting={isSubmitting}
      canSubmit={canSubmit}
      submitLabel={t('dialogs.refundPaymentConfirm')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop
      onSubmit={submit}
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
        label={t('payments.refundReason')}
        type="textarea"
        value={reason}
        placeholder={t('payments.notesOptional')}
        onValueChange={setReason}
      />
    </CreateFormDialog>
  );
}
