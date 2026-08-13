'use client';

import { Repeat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { DetailSheetFieldSegmented } from '@/components/shared';
import { Label } from '@/components/ui/label';
import {
  CUSTOM_PREPAID_MONTH_MAX,
  CUSTOM_PREPAID_MONTH_MIN,
  SUBSCRIPTION_BILLING_FREQUENCIES,
} from '@/features/finance/constants/finance';
import { getSubscriptionPeriodAmountLabel } from '@/features/finance/utils/subscription-form-state';
import type { SubscriptionFormState } from '@/features/finance/utils/subscription-form-state';

interface SubscriptionFormDialogBillingFieldsProps {
  form: SubscriptionFormState;
  billingValidationError: string | null;
  onAmountChange: (amount: string) => void;
  onBillingDayChange: (billingDay: string) => void;
  onPeriodChange: (
    changes: Partial<Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>>,
  ) => void;
}

export function SubscriptionFormDialogBillingFields({
  form,
  billingValidationError,
  onAmountChange,
  onBillingDayChange,
  onPeriodChange,
}: SubscriptionFormDialogBillingFieldsProps) {
  return (
    <>
      <DetailSheetFieldSegmented
        label="Billing frequency"
        icon={<Repeat size={12} />}
        value={form.billingFrequency}
        options={SUBSCRIPTION_BILLING_FREQUENCIES}
        onValueChange={(billingFrequency) =>
          onPeriodChange({
            billingFrequency,
            coverageMonthCount: billingFrequency === 'CUSTOM' ? form.coverageMonthCount : '',
          })
        }
      />

      {form.billingFrequency === 'CUSTOM' ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-coverage-months">
            Coverage months ({CUSTOM_PREPAID_MONTH_MIN}–{CUSTOM_PREPAID_MONTH_MAX})
          </Label>
          <Input
            id="sub-coverage-months"
            type="number"
            min={CUSTOM_PREPAID_MONTH_MIN}
            max={CUSTOM_PREPAID_MONTH_MAX}
            value={form.coverageMonthCount}
            onChange={(e) => onPeriodChange({ coverageMonthCount: e.target.value })}
            required
          />
          {billingValidationError ? (
            <p className="text-destructive text-sm">{billingValidationError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <NbosMoneyInput
          id="sub-amount"
          label={getSubscriptionPeriodAmountLabel(form.billingFrequency)}
          value={form.amount}
          onChange={onAmountChange}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-billing-day">Billing day (1–28)</Label>
          <Input
            id="sub-billing-day"
            type="number"
            min={1}
            max={28}
            value={form.billingDay}
            onChange={(e) => onBillingDayChange(e.target.value)}
            required
          />
        </div>
      </div>
    </>
  );
}
