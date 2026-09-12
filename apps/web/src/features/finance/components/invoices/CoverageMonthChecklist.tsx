'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { isCoverageMonthBlockedBySelection } from '@/features/finance/utils/subscription-invoice-months';
import { CoverageMonthTile } from './CoverageMonthTile';

export function CoverageMonthChecklist({
  eligibleMonths,
  coverageMonths,
  coverageMonthCount,
  canAddMonth,
  disabled,
  onToggle,
}: {
  eligibleMonths: readonly string[];
  coverageMonths: readonly string[];
  coverageMonthCount: number;
  canAddMonth: boolean;
  disabled: boolean;
  onToggle: (monthKey: string) => void;
}) {
  const t = useTranslations('invoices');
  if (eligibleMonths.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t('createSubscription.noUncoveredMonth')}</p>
    );
  }
  return (
    <div className="space-y-3">
      <Label>{t('createSubscription.coverageMonths')}</Label>
      <div className="max-h-80 overflow-y-auto pr-0.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {eligibleMonths.map((monthKey) => (
            <CoverageMonthTile
              key={monthKey}
              monthKey={monthKey}
              checked={coverageMonths.includes(monthKey)}
              blocked={isCoverageMonthBlockedBySelection(
                monthKey,
                coverageMonths,
                coverageMonthCount,
              )}
              canAddMonth={canAddMonth}
              disabled={disabled}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
      <CoverageMonthSummary
        selectedCount={coverageMonths.length}
        coverageMonthCount={coverageMonthCount}
      />
    </div>
  );
}

function CoverageMonthSummary({
  selectedCount,
  coverageMonthCount,
}: {
  selectedCount: number;
  coverageMonthCount: number;
}) {
  const t = useTranslations('invoices');
  const coveredMonths = selectedCount * coverageMonthCount;
  return (
    <div className="space-y-1">
      {coverageMonthCount > 1 ? (
        <p className="text-muted-foreground text-xs">
          {t('createSubscription.eachStartCovers', { count: coverageMonthCount })}
        </p>
      ) : null}
      {selectedCount === 0 ? (
        <p className="text-muted-foreground text-xs">{t('createSubscription.selectAtLeastOne')}</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          {t('createSubscription.covering', { count: coveredMonths })}
        </p>
      )}
    </div>
  );
}
