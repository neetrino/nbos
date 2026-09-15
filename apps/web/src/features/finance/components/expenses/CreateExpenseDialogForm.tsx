'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import type { CreateExpenseFormState } from '@/features/finance/utils/expense-create-defaults';

interface CreateExpenseDialogFormProps {
  form: CreateExpenseFormState;
  setForm: Dispatch<SetStateAction<CreateExpenseFormState>>;
  loading: boolean;
  planField?: ReactNode;
}

export function CreateExpenseDialogForm({
  form,
  setForm,
  loading,
  planField,
}: CreateExpenseDialogFormProps) {
  const t = useTranslations('forms');

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('expense.fields.name')}
        type="text"
        value={form.name}
        placeholder={t('expense.fields.namePlaceholder')}
        disabled={loading}
        onValueChange={(name) => setForm({ ...form, name })}
      />

      {planField}

      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('expense.fields.amount')}
          type="money"
          value={form.amount}
          placeholder="0"
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(amount) => setForm({ ...form, amount })}
        />
        <InlineField
          variant="controlled"
          label={t('expense.fields.dueDate')}
          type="date"
          value={form.dueDate}
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(dueDate) => setForm({ ...form, dueDate })}
        />
      </FormFieldRow>
    </>
  );
}
