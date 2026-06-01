'use client';

import { useEffect, useState } from 'react';
import { formatIsoDateValue } from '@/components/shared/date-picker/date-picker-format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';
import { getNextBusinessDay } from '@/lib/date/business-days';
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
  /** Pre-select project when opening from `/finance/expenses?projectId=`. */
  defaultProjectId?: string | null;
  /** Pre-select status (e.g. Delayed when creating from backlog). */
  defaultStatus?: string;
}

function createEmptyForm(): CreateExpenseFormState {
  return {
    name: '',
    amount: '',
    dueDate: formatIsoDateValue(getNextBusinessDay()),
  };
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  onCreated,
  defaultProjectId = null,
  defaultStatus,
}: CreateExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateExpenseFormState>(createEmptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(createEmptyForm());
    setFormError(null);
  }, [open]);

  const parsedAmount = parseExpenseDraftAmount(form.amount) ?? Number.NaN;
  const canSubmit = Boolean(form.name.trim()) && parseExpenseDraftAmount(form.amount) != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const status =
      defaultStatus && SCHEMA_EXPENSE_STATUSES.has(defaultStatus) ? defaultStatus : undefined;

    const payload = buildCreateExpensePayload(form, {
      defaultProjectId,
      defaultStatus: status,
    });
    if (!payload) return;

    setLoading(true);
    setFormError(null);
    try {
      const created = await expensesApi.create(payload);
      onCreated(created);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          'Expense could not be created. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
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
