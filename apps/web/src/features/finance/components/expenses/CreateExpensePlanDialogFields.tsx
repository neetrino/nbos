'use client';

import { CreateFormSwitchField, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { FinanceProductCredentialFields } from '@/features/finance/components/FinanceProductCredentialFields';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import { EXPENSE_FREQUENCIES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ExpensePlanFormState } from '@/features/finance/utils/expense-plan-form-state';
import { projectDisplayName } from '@/lib/format/project-product-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import {
  translateExpensePlanCategory,
  translateExpensePlanFrequency,
  useExpensePlansT,
} from './expense-plan-message-keys';

interface CreateExpensePlanDialogFieldsProps {
  form: ExpensePlanFormState;
  productLabel: string | null;
  credentialLabel: string | null;
  planToEdit?: ExpensePlan | null;
  onFormChange: (partial: Partial<ExpensePlanFormState>) => void;
  onProductSelect: (id: string, label: string) => void;
  onProductClear: () => void;
  onCredentialSelect: (id: string, label: string) => void;
  onCredentialClear: () => void;
}

export function CreateExpensePlanDialogFields({
  form,
  productLabel,
  credentialLabel,
  planToEdit,
  onFormChange,
  onProductSelect,
  onProductClear,
  onCredentialSelect,
  onCredentialClear,
}: CreateExpensePlanDialogFieldsProps) {
  const t = useExpensePlansT();
  const categoryOptions = EXPENSE_CATEGORIES.map((option) => ({
    value: option.value,
    label: translateExpensePlanCategory(t, option.value, option.label),
  }));
  const frequencyOptions = EXPENSE_FREQUENCIES.map((option) => ({
    value: option.value,
    label: translateExpensePlanFrequency(t, option.value),
  }));

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('create.name')}
        type="text"
        value={form.name}
        placeholder={t('create.namePlaceholder')}
        onValueChange={(name) => onFormChange({ name })}
      />
      <CategoryAmountRow
        form={form}
        categoryOptions={categoryOptions}
        onFormChange={onFormChange}
      />
      <FrequencyDueRow
        form={form}
        frequencyOptions={frequencyOptions}
        onFormChange={onFormChange}
      />
      <FinanceProductCredentialFields
        productId={form.productId || null}
        productLabel={productLabel}
        credentialId={form.credentialId || null}
        credentialLabel={credentialLabel}
        projectHint={form.productId ? null : projectDisplayName(planToEdit?.project ?? null)}
        onProductSelect={onProductSelect}
        onProductClear={onProductClear}
        onCredentialSelect={onCredentialSelect}
        onCredentialClear={onCredentialClear}
      />
      <CreateFormSwitchField
        label={t('create.autoGenerate')}
        checked={form.autoGenerate}
        onCheckedChange={(autoGenerate) => onFormChange({ autoGenerate })}
      />
      <InlineField
        variant="controlled"
        label={t('create.notes')}
        type="textarea"
        value={form.notes}
        onValueChange={(notes) => onFormChange({ notes })}
      />
    </>
  );
}

function CategoryAmountRow({
  form,
  categoryOptions,
  onFormChange,
}: {
  form: ExpensePlanFormState;
  categoryOptions: Array<{ value: string; label: string }>;
  onFormChange: (partial: Partial<ExpensePlanFormState>) => void;
}) {
  const t = useExpensePlansT();
  return (
    <FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('create.category')}
        type="select"
        value={form.category}
        options={categoryOptions}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(category) => category && onFormChange({ category })}
      />
      <InlineField
        variant="controlled"
        label={t('create.amount')}
        type="money"
        value={form.amount}
        placeholder={t('create.amountPlaceholder')}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(amount) => onFormChange({ amount })}
      />
    </FormFieldRow>
  );
}

function FrequencyDueRow({
  form,
  frequencyOptions,
  onFormChange,
}: {
  form: ExpensePlanFormState;
  frequencyOptions: Array<{ value: string; label: string }>;
  onFormChange: (partial: Partial<ExpensePlanFormState>) => void;
}) {
  const t = useExpensePlansT();
  return (
    <FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('create.frequency')}
        type="select"
        value={form.frequency}
        options={frequencyOptions}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(frequency) => frequency && onFormChange({ frequency })}
      />
      <InlineField
        variant="controlled"
        label={t('create.nextDue')}
        type="date"
        value={form.nextDueDate}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(nextDueDate) => onFormChange({ nextDueDate })}
      />
    </FormFieldRow>
  );
}
