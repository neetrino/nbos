'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export const CREATE_EXPENSE_PLAN_NONE = 'none';

interface CreateExpenseDialogPlanFieldProps {
  plans: ExpensePlan[];
  value: string;
  disabled?: boolean;
  onChange: (planId: string) => void;
}

export function CreateExpenseDialogPlanField({
  plans,
  value,
  disabled = false,
  onChange,
}: CreateExpenseDialogPlanFieldProps) {
  const t = useTranslations('forms');
  const selectValue = value.trim() ? value : CREATE_EXPENSE_PLAN_NONE;
  const options = [
    { value: CREATE_EXPENSE_PLAN_NONE, label: t('expense.fields.planNone') },
    ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
  ];

  return (
    <InlineField
      variant="controlled"
      type="select"
      label={t('expense.fields.plan')}
      value={selectValue}
      options={options}
      disabled={disabled}
      selectMenuTone="highlight"
      onValueChange={(next) => {
        onChange(!next || next === CREATE_EXPENSE_PLAN_NONE ? '' : next);
      }}
    />
  );
}
