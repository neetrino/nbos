'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  formatSubscriptionInvoiceMonthLabel,
  isCoverageMonthBlockedBySelection,
} from '@/features/finance/utils/subscription-invoice-months';

export function CoverageMonthChecklist({
  eligibleMonths,
  coverageMonths,
  coverageMonthCount,
  periodAmount,
  canAddMonth,
  disabled,
  onToggle,
}: {
  eligibleMonths: readonly string[];
  coverageMonths: readonly string[];
  coverageMonthCount: number;
  periodAmount: number;
  canAddMonth: boolean;
  disabled: boolean;
  onToggle: (monthKey: string) => void;
}) {
  if (eligibleMonths.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No uncovered month is available. Only active subscriptions can invoice uncovered months from
        the billing start through the next 12 months.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <Label>Coverage months</Label>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
        {eligibleMonths.map((monthKey) => (
          <CoverageMonthRow
            key={monthKey}
            monthKey={monthKey}
            checked={coverageMonths.includes(monthKey)}
            blocked={isCoverageMonthBlockedBySelection(monthKey, coverageMonths, coverageMonthCount)}
            canAddMonth={canAddMonth}
            disabled={disabled}
            onToggle={onToggle}
          />
        ))}
      </div>
      <CoverageMonthSummary
        selectedCount={coverageMonths.length}
        coverageMonthCount={coverageMonthCount}
        periodAmount={periodAmount}
      />
    </div>
  );
}

function CoverageMonthRow({
  monthKey,
  checked,
  blocked,
  canAddMonth,
  disabled,
  onToggle,
}: {
  monthKey: string;
  checked: boolean;
  blocked: boolean;
  canAddMonth: boolean;
  disabled: boolean;
  onToggle: (monthKey: string) => void;
}) {
  const rowDisabled = disabled || blocked || (!checked && !canAddMonth);
  const inputId = `subscription-invoice-month-${monthKey}`;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Checkbox
        id={inputId}
        checked={checked}
        disabled={rowDisabled}
        onCheckedChange={() => {
          if (!rowDisabled) onToggle(monthKey);
        }}
      />
      <Label htmlFor={inputId} className="font-normal">
        {formatSubscriptionInvoiceMonthLabel(monthKey)}
      </Label>
    </div>
  );
}

function CoverageMonthSummary({
  selectedCount,
  coverageMonthCount,
  periodAmount,
}: {
  selectedCount: number;
  coverageMonthCount: number;
  periodAmount: number;
}) {
  return (
    <div className="space-y-1">
      {coverageMonthCount > 1 ? (
        <p className="text-muted-foreground text-xs">
          Each invoice covers {coverageMonthCount} months starting in the selected month.
          Overlapping starts stay disabled.
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        {selectedCount === 0
          ? 'Select one or more uncovered months. Each month becomes a separate invoice.'
          : `${selectedCount} ${selectedCount === 1 ? 'invoice' : 'invoices'} · ${formatAmount(selectedCount * periodAmount)}`}
      </p>
    </div>
  );
}
