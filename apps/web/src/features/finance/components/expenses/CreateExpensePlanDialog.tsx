'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  expensePlansApi,
  type CreateExpensePlanPayload,
  type ExpensePlan,
} from '@/lib/api/expense-plans';
import {
  EMPTY_EXPENSE_PLAN_FORM,
  expensePlanToFormState,
  type ExpensePlanFormState,
} from '@/features/finance/utils/expense-plan-form-state';
import { CreateExpensePlanDialogFields } from './CreateExpensePlanDialogFields';
import { useExpensePlansT } from './expense-plan-message-keys';

interface CreateExpensePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog updates this plan instead of creating a new one. */
  planToEdit?: ExpensePlan | null;
  /** Pre-filled fields when opening from a client service sheet. */
  initialForm?: Partial<ExpensePlanFormState>;
  /** Custom submit instead of default `expensePlansApi.create`. */
  submitOverride?: (form: ExpensePlanFormState) => Promise<ExpensePlan>;
  forceNestedBackdrop?: boolean;
  onCreated?: (plan: ExpensePlan) => void;
  onUpdated?: (plan: ExpensePlan) => void;
}

export function CreateExpensePlanDialog(props: CreateExpensePlanDialogProps) {
  const sessionKey = props.open
    ? `${props.planToEdit?.id ?? 'create'}:${JSON.stringify(props.initialForm ?? {})}`
    : 'closed';
  return <CreateExpensePlanDialogSession key={sessionKey} {...props} />;
}

function CreateExpensePlanDialogSession({
  open,
  onOpenChange,
  planToEdit = null,
  initialForm,
  submitOverride,
  forceNestedBackdrop = false,
  onCreated,
  onUpdated,
}: CreateExpensePlanDialogProps) {
  const t = useExpensePlansT();
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<ExpensePlanFormState>(() =>
    planToEdit
      ? expensePlanToFormState(planToEdit)
      : { ...EMPTY_EXPENSE_PLAN_FORM, ...initialForm },
  );
  const [productLabel, setProductLabel] = useState<string | null>(
    planToEdit?.product?.name ?? null,
  );
  const [credentialLabel, setCredentialLabel] = useState<string | null>(
    planToEdit?.credential?.name ?? null,
  );

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const canSubmit = Boolean(form.name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isEdit = Boolean(planToEdit);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('create.editTitle') : t('create.title')}
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={isEdit ? tCommon('save') : t('create.submit')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitExpensePlan({
          event,
          canSubmit,
          form,
          parsedAmount,
          isEdit,
          planToEdit,
          submitOverride,
          onCreated,
          onUpdated,
          onOpenChange,
          setLoading,
          setFormError,
          createError: t('errors.create'),
          saveError: t('errors.save'),
        })
      }
    >
      <CreateExpensePlanDialogFields
        form={form}
        productLabel={productLabel}
        credentialLabel={credentialLabel}
        planToEdit={planToEdit}
        onFormChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
        onProductSelect={(id, label) => {
          setForm((prev) => ({ ...prev, productId: id }));
          setProductLabel(label);
        }}
        onProductClear={() => {
          setForm((prev) => ({ ...prev, productId: '' }));
          setProductLabel(null);
        }}
        onCredentialSelect={(id, label) => {
          setForm((prev) => ({ ...prev, credentialId: id }));
          setCredentialLabel(label);
        }}
        onCredentialClear={() => {
          setForm((prev) => ({ ...prev, credentialId: '' }));
          setCredentialLabel(null);
        }}
      />
    </CreateFormDialog>
  );
}

async function submitExpensePlan(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: ExpensePlanFormState;
  parsedAmount: number;
  isEdit: boolean;
  planToEdit: ExpensePlan | null;
  submitOverride?: (form: ExpensePlanFormState) => Promise<ExpensePlan>;
  onCreated?: (plan: ExpensePlan) => void;
  onUpdated?: (plan: ExpensePlan) => void;
  onOpenChange: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setFormError: (error: string | null) => void;
  createError: string;
  saveError: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  options.setFormError(null);
  const payload: CreateExpensePlanPayload = {
    name: options.form.name.trim(),
    category: options.form.category,
    amount: options.parsedAmount,
    frequency: options.form.frequency,
    nextDueDate: options.form.nextDueDate.trim() ? options.form.nextDueDate : null,
    productId: options.form.productId.trim() || null,
    credentialId: options.form.credentialId.trim() || null,
    autoGenerate: options.form.autoGenerate,
    notes: options.form.notes.trim() || null,
  };
  try {
    if (options.submitOverride && !options.isEdit) {
      options.onCreated?.(await options.submitOverride(options.form));
    } else if (options.isEdit && options.planToEdit) {
      options.onUpdated?.(await expensePlansApi.update(options.planToEdit.id, payload));
    } else {
      options.onCreated?.(await expensePlansApi.create(payload));
    }
    options.onOpenChange(false);
  } catch (caught) {
    options.setFormError(
      getApiErrorMessage(caught, options.isEdit ? options.saveError : options.createError),
    );
  } finally {
    options.setLoading(false);
  }
}
