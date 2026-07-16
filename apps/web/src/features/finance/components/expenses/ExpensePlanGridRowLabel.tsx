'use client';

import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';

interface ExpensePlanGridRowLabelProps {
  planName: string;
  frequency: string;
  projectLabel: string | null;
}

function planInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const second = parts[1];
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}

export function ExpensePlanGridRowLabel({
  planName,
  frequency,
  projectLabel,
}: ExpensePlanGridRowLabelProps) {
  const frequencyText = expensePlanFrequencyLabel(frequency);
  const subtitle = [projectLabel, frequencyText].filter(Boolean).join(' · ');

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="bg-muted/50 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        aria-hidden
      >
        {planInitials(planName)}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium" title={planName}>
          {planName}
        </div>
        {subtitle ? (
          <div className="text-muted-foreground truncate text-xs" title={subtitle}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
