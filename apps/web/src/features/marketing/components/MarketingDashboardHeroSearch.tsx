'use client';

import { IntegratedSearchFilters } from '@/components/shared';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMarketingDashboardPeriodCaption } from '@/features/marketing/utils/format-marketing-dashboard-period-caption';
import {
  MARKETING_DASHBOARD_PERIOD_LABELS,
  type MarketingDashboardPeriodPreset,
} from '@/features/marketing/constants/marketing-dashboard-period';
import type { MarketingDashboardSummary } from '@/lib/api/marketing';

const PERIOD_SELECT_CLASS = 'h-10 w-[11.5rem] shrink-0';

type MarketingDashboardHeroSearchProps = {
  search: string;
  onSearchChange: (search: string) => void;
  preset: MarketingDashboardPeriodPreset;
  onPresetChange: (preset: MarketingDashboardPeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  summary: MarketingDashboardSummary | null;
  disabled?: boolean;
};

export function MarketingDashboardHeroSearch({
  search,
  onSearchChange,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  summary,
  disabled,
}: MarketingDashboardHeroSearchProps) {
  const periodLabel = MARKETING_DASHBOARD_PERIOD_LABELS[preset];
  const caption = summary ? formatMarketingDashboardPeriodCaption(summary) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <IntegratedSearchFilters
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search dashboard metrics…"
          />
        </div>
        <Select
          value={preset}
          onValueChange={(value) =>
            onPresetChange((value as MarketingDashboardPeriodPreset) ?? preset)
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="marketing-dashboard-period"
            className={PERIOD_SELECT_CLASS}
            aria-label="Dashboard period"
          >
            <SelectValue placeholder="Period">{periodLabel}</SelectValue>
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
      </div>

      {preset === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="space-y-1">
            <Label htmlFor="marketing-custom-from" className="text-xs">
              From
            </Label>
            <NbosDatePicker
              id="marketing-custom-from"
              value={customFrom}
              onChange={onCustomFromChange}
              disabled={disabled}
              aria-label="Custom period from"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="marketing-custom-to" className="text-xs">
              To
            </Label>
            <NbosDatePicker
              id="marketing-custom-to"
              value={customTo}
              onChange={onCustomToChange}
              disabled={disabled}
              aria-label="Custom period to"
            />
          </div>
        </div>
      ) : null}

      {caption ? (
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">Applied range:</span> {caption}
        </p>
      ) : null}
    </div>
  );
}
