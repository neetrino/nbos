import { cn } from '@/lib/utils';

export function BonusPoolSheetMetricRow({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', accentClass)}>{value}</span>
    </div>
  );
}
