'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';
import { expensesApi, type Expense } from '@/lib/api/finance';
import { getNextBusinessDay } from '@/lib/date/business-days';
import { formatIsoDateValue } from '@/components/shared/date-picker/date-picker-format';
import { SCHEMA_EXPENSE_STATUSES } from './edit-expense-dialog-constants';
import {
  applyExpensePlanToCreateForm,
  buildCreateExpensePayload,
  type CreateExpenseFormState,
  type ExpenseCreateLinkedPlan,
} from '@/features/finance/utils/expense-create-defaults';
import { CreateExpenseDialogForm } from './CreateExpenseDialogForm';
import { CreateExpenseDialogPlanField } from './CreateExpenseDialogPlanField';
import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';
import { useActiveExpensePlans } from '@/features/finance/hooks/use-active-expense-plans';
import type { ExpensePlan } from '@/lib/api/expense-plans';

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
  /** When set, the card is always linked to this plan and the picker is hidden. */
  lockedExpensePlan?: ExpensePlan | null;
  /** Hide the plan picker (client-service create keeps its own source). */
  showPlanPicker?: boolean;
}

function toLinkedPlan(plan: ExpensePlan): ExpenseCreateLinkedPlan {
  return {
    id: plan.id,
    name: plan.name,
    category: plan.category,
    productId: plan.productId,
    credentialId: plan.credentialId,
  };
}

function createEmptyForm(): CreateExpenseFormState {
  return {
    name: '',
    amount: '',
    dueDate: formatIsoDateValue(getNextBusinessDay()),
    expensePlanId: '',
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
  lockedExpensePlan = null,
  showPlanPicker = true,
}: CreateExpenseDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateExpenseFormState>(createEmptyForm);
  const initialFormKey = JSON.stringify(initialForm ?? {});
  const pickerEnabled = open && showPlanPicker && !lockedExpensePlan;
  const plans = useActiveExpensePlans(pickerEnabled);

  useEffect(() => {
    if (!open) return;
    const merged = mergeInitialForm(initialForm);
    if (lockedExpensePlan) {
      setForm({
        ...merged,
        expensePlanId: lockedExpensePlan.id,
        name: merged.name.trim() ? merged.name : lockedExpensePlan.name,
      });
    } else {
      setForm(merged);
    }
    setFormError(null);
  }, [open, initialFormKey, initialForm, lockedExpensePlan]);

  const canSubmit = Boolean(form.name.trim()) && parseExpenseDraftAmount(form.amount) != null;
  const linkedPlan = useMemo(() => {
    if (lockedExpensePlan) return toLinkedPlan(lockedExpensePlan);
    const match = plans.find((plan) => plan.id === form.expensePlanId);
    return match ? toLinkedPlan(match) : null;
  }, [form.expensePlanId, lockedExpensePlan, plans]);

  const handlePlanChange = (planId: string) => {
    const previous = linkedPlan;
    const nextPlan = plans.find((plan) => plan.id === planId);
    setForm((current) =>
      applyExpensePlanToCreateForm(current, previous, nextPlan ? toLinkedPlan(nextPlan) : null),
    );
  };

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
              linkedPlan,
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
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('expense.title')}
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <CreateExpenseDialogForm
        form={form}
        setForm={setForm}
        loading={loading}
        planField={
          pickerEnabled ? (
            <CreateExpenseDialogPlanField
              plans={plans}
              value={form.expensePlanId}
              disabled={loading}
              onChange={handlePlanChange}
            />
          ) : null
        }
      />
    </CreateFormDialog>
  );
}
