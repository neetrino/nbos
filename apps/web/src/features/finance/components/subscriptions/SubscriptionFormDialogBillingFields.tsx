'use client';

import { Calendar, Layers, Repeat } from 'lucide-react';
import { InlineField } from '@/components/shared';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  CUSTOM_PREPAID_MONTH_MAX,
  CUSTOM_PREPAID_MONTH_MIN,
  SUBSCRIPTION_BILLING_FREQUENCIES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import { getSubscriptionPeriodAmountLabel } from '@/features/finance/utils/subscription-form-state';
import type { SubscriptionFormState } from '@/features/finance/utils/subscription-form-state';
import { SubscriptionAmountTaxField } from './SubscriptionAmountTaxField';

interface SubscriptionFormDialogBillingFieldsProps {
  form: SubscriptionFormState;
  billingValidationError: string | null;
  onAmountChange: (amount: string) => void;
  onBillingDayChange: (billingDay: string) => void;
  onTaxStatusChange: (taxStatus: string) => void;
  onTypeChange: (type: string) => void;
  onPeriodChange: (
    changes: Partial<Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>>,
  ) => void;
}

export function SubscriptionFormDialogBillingFields({
  form,
  billingValidationError,
  onAmountChange,
  onBillingDayChange,
  onTaxStatusChange,
  onTypeChange,
  onPeriodChange,
}: SubscriptionFormDialogBillingFieldsProps) {
  return (
    <>
      <AmountAndTypeRow
        form={form}
        onAmountChange={onAmountChange}
        onTaxStatusChange={onTaxStatusChange}
        onTypeChange={onTypeChange}
      />
      <FrequencyAndDayRow
        form={form}
        onBillingDayChange={onBillingDayChange}
        onPeriodChange={onPeriodChange}
      />
      {form.billingFrequency === 'CUSTOM' ? (
        <CoverageMonthsRow form={form} onPeriodChange={onPeriodChange} />
      ) : null}
      {billingValidationError ? (
        <p className="text-destructive text-sm">{billingValidationError}</p>
      ) : null}
    </>
  );
}

function AmountAndTypeRow({
  form,
  onAmountChange,
  onTaxStatusChange,
  onTypeChange,
}: Pick<
  SubscriptionFormDialogBillingFieldsProps,
  'form' | 'onAmountChange' | 'onTaxStatusChange' | 'onTypeChange'
>) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <SubscriptionAmountTaxField
        amountLabel={getSubscriptionPeriodAmountLabel(form.billingFrequency)}
        amount={form.amount}
        taxStatus={form.taxStatus}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onAmountChange={onAmountChange}
        onTaxStatusChange={onTaxStatusChange}
      />
      <InlineField
        variant="controlled"
        label="Type"
        type="select"
        value={form.type}
        options={SUBSCRIPTION_TYPES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<Layers size={12} />}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(type) => type && onTypeChange(type)}
      />
    </div>
  );
}

function FrequencyAndDayRow({
  form,
  onBillingDayChange,
  onPeriodChange,
}: Pick<
  SubscriptionFormDialogBillingFieldsProps,
  'form' | 'onBillingDayChange' | 'onPeriodChange'
>) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Frequency"
        type="select"
        value={form.billingFrequency}
        options={SUBSCRIPTION_BILLING_FREQUENCIES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<Repeat size={12} />}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(billingFrequency) =>
          billingFrequency &&
          onPeriodChange({
            billingFrequency,
            coverageMonthCount: billingFrequency === 'CUSTOM' ? form.coverageMonthCount : '',
          })
        }
      />
      <InlineField
        variant="controlled"
        label="Billing day"
        type="number"
        value={form.billingDay}
        placeholder="1–28"
        icon={<Calendar size={12} />}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={onBillingDayChange}
      />
    </div>
  );
}

function CoverageMonthsRow({
  form,
  onPeriodChange,
}: Pick<SubscriptionFormDialogBillingFieldsProps, 'form' | 'onPeriodChange'>) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Coverage"
        type="number"
        value={form.coverageMonthCount}
        placeholder={`${CUSTOM_PREPAID_MONTH_MIN}–${CUSTOM_PREPAID_MONTH_MAX}`}
        icon={<Repeat size={12} />}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(coverageMonthCount) => onPeriodChange({ coverageMonthCount })}
      />
    </div>
  );
}
