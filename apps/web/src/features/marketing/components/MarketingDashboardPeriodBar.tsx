'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MarketingDashboardSummary } from '@/lib/api/marketing';
import {
  MARKETING_DASHBOARD_PERIOD_LABELS,
  type MarketingDashboardPeriodPreset,
} from '@/features/marketing/constants/marketing-dashboard-period';

export function formatMarketingDashboardPeriodCaption(summary: MarketingDashboardSummary): string {
  if (!summary.period) {
    return MARKETING_DASHBOARD_PERIOD_LABELS.all;
  }
  const from = new Date(summary.period.dateFrom);
  const to = new Date(summary.period.dateTo);
  return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
}

export interface MarketingDashboardPeriodBarProps {
  preset: MarketingDashboardPeriodPreset;
  onPresetChange: (preset: MarketingDashboardPeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  summary: MarketingDashboardSummary | null;
  disabled?: boolean;
}

export function MarketingDashboardPeriodBar({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  summary,
  disabled,
}: MarketingDashboardPeriodBarProps) {
  const caption = summary ? formatMarketingDashboardPeriodCaption(summary) : null;

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <Label htmlFor="marketing-dashboard-period">Period</Label>
        <Select
          value={preset}
          onValueChange={(v) => onPresetChange(v as MarketingDashboardPeriodPreset)}
          disabled={disabled}
        >
          <SelectTrigger id="marketing-dashboard-period" className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.keys(MARKETING_DASHBOARD_PERIOD_LABELS) as MarketingDashboardPeriodPreset[]
            ).map((key) => (
              <SelectItem key={key} value={key}>
                {MARKETING_DASHBOARD_PERIOD_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {preset === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="space-y-1">
              <Label htmlFor="marketing-custom-from" className="text-xs">
                From
              </Label>
              <input
                id="marketing-custom-from"
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
                disabled={disabled}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="marketing-custom-to" className="text-xs">
                To
              </Label>
              <input
                id="marketing-custom-to"
                type="date"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
                disabled={disabled}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          </div>
        ) : null}
      </div>
      {caption ? (
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Applied range:</span> {caption}
        </p>
      ) : null}
    </div>
  );
}
