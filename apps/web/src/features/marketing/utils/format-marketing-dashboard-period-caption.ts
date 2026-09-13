import type { MarketingTranslate } from '@/features/marketing/i18n/marketing-copy';
import { translateMarketingDashboardPeriodLabel } from '@/features/marketing/i18n/marketing-copy';
import type { MarketingDashboardSummary } from '@/lib/api/marketing';

export function formatMarketingDashboardPeriodCaption(
  summary: MarketingDashboardSummary,
  t: MarketingTranslate,
): string {
  if (!summary.period) {
    return translateMarketingDashboardPeriodLabel(t, 'all');
  }
  const from = new Date(summary.period.dateFrom);
  const to = new Date(summary.period.dateTo);
  return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
}
