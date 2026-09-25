'use client';

import { InlineField } from '@/components/shared';

export function parseTargetAmountDraft(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function KpiPolicyTargetField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <InlineField
        variant="controlled"
        type="money"
        label="Sales monthly KPI target"
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      <p className="text-muted-foreground text-xs">
        Stored on the policy. Payroll uses the resolved plan and actual.
      </p>
    </div>
  );
}
