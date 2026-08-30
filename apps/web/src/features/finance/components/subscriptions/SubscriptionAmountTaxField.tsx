'use client';

import { DollarSign } from 'lucide-react';
import { SegmentedTabs } from '@/components/shared';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { TAX_STATUSES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { cn } from '@/lib/utils';

interface SubscriptionAmountTaxFieldProps {
  amountLabel: string;
  amount: string;
  taxStatus: string;
  disabled?: boolean;
  onAmountChange: (amount: string) => void;
  onTaxStatusChange: (taxStatus: string) => void;
}

export function SubscriptionAmountTaxField({
  amountLabel,
  amount,
  taxStatus,
  disabled = false,
  onAmountChange,
  onTaxStatusChange,
}: SubscriptionAmountTaxFieldProps) {
  const taxValue = taxStatus === 'TAX_FREE' ? 'TAX_FREE' : 'TAX';

  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{amountLabel}</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'gap-2 pr-1.5')}>
        <DollarSign size={12} className="text-muted-foreground/70 shrink-0" aria-hidden />
        <MoneyInput
          value={amount}
          disabled={disabled}
          placeholder="Enter amount…"
          className={cn(
            DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
            'min-w-0 truncate text-sm tabular-nums',
          )}
          onChange={onAmountChange}
        />
        <SegmentedTabs
          value={taxValue}
          options={TAX_STATUSES}
          ariaLabel="Tax"
          listClassName="shrink-0 rounded-full bg-background p-0.5"
          pillClassName="rounded-full"
          buttonClassName="min-w-[2.75rem] rounded-full px-3 py-1 text-xs font-medium"
          onChange={onTaxStatusChange}
        />
      </div>
    </div>
  );
}
