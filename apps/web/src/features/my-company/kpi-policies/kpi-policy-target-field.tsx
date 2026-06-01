import { Input } from '@/components/ui/input';

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
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">Sales monthly KPI target</span>
      <Input
        value={value}
        disabled={disabled}
        inputMode="decimal"
        placeholder="e.g. 3000000"
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-muted-foreground block text-xs">
        Stored in My Company policy. Payroll only consumes the resolved plan and actual.
      </span>
    </label>
  );
}
