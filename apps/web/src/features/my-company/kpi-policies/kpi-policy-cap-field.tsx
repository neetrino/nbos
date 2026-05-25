'use client';

import { Input } from '@/components/ui/input';
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
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">Monthly bonus cap (× base salary)</span>
      <Input
        type="number"
        min={KPI_POLICY_CAP_MULTIPLIER_MIN}
        max={KPI_POLICY_CAP_MULTIPLIER_MAX}
        step={0.1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-muted-foreground text-xs">
        Default {KPI_POLICY_CAP_MULTIPLIER_DEFAULT} ({KPI_POLICY_CAP_MULTIPLIER_MIN}–
        {KPI_POLICY_CAP_MULTIPLIER_MAX}). Payroll attach caps variable bonus at base × this value;
        excess becomes carry-over.
      </p>
    </label>
  );
}
