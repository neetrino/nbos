'use client';

import { InlineField } from '@/components/shared';
import {
  KPI_POLICY_CAP_MULTIPLIER_DEFAULT,
  KPI_POLICY_CAP_MULTIPLIER_MAX,
  KPI_POLICY_CAP_MULTIPLIER_MIN,
} from './kpi-policy-cap.constants';

export function parseCapMultiplierDraft(value: string): number | null {
  const n = Number.parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(n)) {
    return null;
  }
  if (n < KPI_POLICY_CAP_MULTIPLIER_MIN || n > KPI_POLICY_CAP_MULTIPLIER_MAX) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

export function KpiPolicyCapField({
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
        label="Monthly ceiling"
        value={value}
        suffix="× salary"
        disabled={disabled}
        onValueChange={onChange}
      />
      <p className="text-muted-foreground text-xs">
        {KPI_POLICY_CAP_MULTIPLIER_MIN}–{KPI_POLICY_CAP_MULTIPLIER_MAX} times base salary. Default{' '}
        {KPI_POLICY_CAP_MULTIPLIER_DEFAULT}. Anything above carries to the next month.
      </p>
    </div>
  );
}
