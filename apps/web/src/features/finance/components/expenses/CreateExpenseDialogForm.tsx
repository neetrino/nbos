'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { InlineField } from '@/components/shared';
import type { CreateExpenseFormState } from '@/features/finance/utils/expense-create-defaults';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from './edit-expense-dialog-constants';

interface CreateExpenseDialogFormProps {
  form: CreateExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<CreateExpenseFormState>>;
  formError: string | null;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  planField?: ReactNode;
  submitIdleLabel?: string;
  submitLoadingLabel?: string;
}

export function CreateExpenseDialogForm({
  form,
  setForm,
  formError,
  loading,
  canSubmit,
  onSubmit,
  onCancel,
  planField,
  submitIdleLabel,
  submitLoadingLabel,
}: CreateExpenseDialogFormProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const idleLabel = submitIdleLabel ?? tCommon('create');
  const loadingLabel = submitLoadingLabel ?? tCommon('creating');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}

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

      <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
        <InlineField
          variant="controlled"
          label={t('expense.fields.amount')}
          type="money"
          value={form.amount}
          placeholder="0"
          disabled={loading}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onValueChange={(amount) => setForm({ ...form, amount })}
        />
        <InlineField
          variant="controlled"
          label={t('expense.fields.dueDate')}
          type="date"
          value={form.dueDate}
          disabled={loading}
          className={EXPENSE_SHEET_FIELD_CELL_CLASS}
          onValueChange={(dueDate) => setForm({ ...form, dueDate })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? loadingLabel : idleLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
