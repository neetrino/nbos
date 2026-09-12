'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NbosDatePicker } from '@/components/shared/date-picker';
import type { CreateExpenseFormState } from '@/features/finance/utils/expense-create-defaults';

interface CreateExpenseDialogFormProps {
  form: CreateExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<CreateExpenseFormState>>;
  parsedAmount: number;
  formError: string | null;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitIdleLabel?: string;
  submitLoadingLabel?: string;
}

export function CreateExpenseDialogForm({
  form,
  setForm,
  parsedAmount,
  formError,
  loading,
  canSubmit,
  onSubmit,
  onCancel,
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

      <div className="space-y-2">
        <Label>{t('expense.fields.name')}</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('expense.fields.namePlaceholder')}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t('expense.fields.amount')}</Label>
          <Input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            aria-invalid={form.amount.trim() !== '' && !Number.isFinite(parsedAmount)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('expense.fields.dueDate')}</Label>
          <NbosDatePicker
            value={form.dueDate}
            onChange={(dueDate) => setForm({ ...form, dueDate })}
            aria-label={t('expense.fields.dueDateAria')}
          />
        </div>
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
