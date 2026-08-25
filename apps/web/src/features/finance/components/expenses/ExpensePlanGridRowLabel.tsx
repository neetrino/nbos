'use client';

import { formatExpensePlanGridRowSubtitle } from '@/features/finance/utils/expense-plan-display';

interface ExpensePlanGridRowLabelProps {
  rowNumber: number;
  planName: string;
  frequency: string;
  projectLabel: string | null;
}

export function ExpensePlanGridRowLabel({
  rowNumber,
  planName,
  frequency,
  projectLabel,
}: ExpensePlanGridRowLabelProps) {
  const subtitle = formatExpensePlanGridRowSubtitle({ frequency, projectLabel });

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="bg-muted/50 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        aria-hidden
      >
        {rowNumber}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium" title={planName}>
          {planName}
        </div>
        {subtitle.text ? (
          <div className="text-muted-foreground truncate text-xs" title={subtitle.title}>
            {subtitle.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}
