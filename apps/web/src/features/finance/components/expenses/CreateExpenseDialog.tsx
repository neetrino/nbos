'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';
import { expensesApi, type Expense } from '@/lib/api/finance';
import { getNextBusinessDay } from '@/lib/date/business-days';
import { formatIsoDateValue } from '@/components/shared/date-picker/date-picker-format';
import { SCHEMA_EXPENSE_STATUSES } from './edit-expense-dialog-constants';
import {
  buildCreateExpensePayload,
  type CreateExpenseFormState,
} from '@/features/finance/utils/expense-create-defaults';
import { CreateExpenseDialogForm } from './CreateExpenseDialogForm';
import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: Expense) => void;
  /** Pre-select product when opening from a product finance hub. */
  defaultProductId?: string | null;
  /** Pre-select status (e.g. Delayed when creating from backlog). */
  defaultStatus?: string;
  /** Pre-filled fields when opening from a client service sheet. */
  initialForm?: Partial<CreateExpenseFormState>;
  /** Custom submit instead of default `expensesApi.create`. */
  submitOverride?: (form: CreateExpenseFormState) => Promise<Expense>;
  forceNestedBackdrop?: boolean;
}

function createEmptyForm(): CreateExpenseFormState {
  return {
    name: '',
    amount: '',
    dueDate: formatIsoDateValue(getNextBusinessDay()),
  };
}

function mergeInitialForm(initialForm?: Partial<CreateExpenseFormState>): CreateExpenseFormState {
  return { ...createEmptyForm(), ...initialForm };
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  onCreated,
  defaultProductId = null,
  defaultStatus,
  initialForm,
  submitOverride,
  forceNestedBackdrop = false,
}: CreateExpenseDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateExpenseFormState>(createEmptyForm);
  const initialFormKey = JSON.stringify(initialForm ?? {});

  useEffect(() => {
    if (!open) return;
    setForm(mergeInitialForm(initialForm));
    setFormError(null);
  }, [open, initialFormKey, initialForm]);

  const parsedAmount = parseExpenseDraftAmount(form.amount) ?? Number.NaN;
  const canSubmit = Boolean(form.name.trim()) && parseExpenseDraftAmount(form.amount) != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setFormError(null);
    try {
      const created = submitOverride
        ? await submitOverride(form)
        : await expensesApi.create(
            buildCreateExpensePayload(form, {
              defaultProductId,
              defaultStatus:
                defaultStatus && SCHEMA_EXPENSE_STATUSES.has(defaultStatus)
                  ? defaultStatus
                  : undefined,
            })!,
          );
      onCreated(created);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        localizeCaughtApiError(
          caught,
          firstReleaseFormErrorCopy(
            tCommon('permissionDenied'),
            t('expense.createError'),
            t('errors.validation'),
            t('expense.createError'),
            t('errors.network'),
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{t('expense.title')}</DialogTitle>
        </DialogHeader>

        <CreateExpenseDialogForm
          form={form}
          setForm={setForm}
          parsedAmount={parsedAmount}
          formError={formError}
          loading={loading}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
