import type { MarketingDashboardSummary } from '@/lib/api/marketing';
import { MARKETING_DASHBOARD_PERIOD_LABELS } from '@/features/marketing/constants/marketing-dashboard-period';

export function formatMarketingDashboardPeriodCaption(summary: MarketingDashboardSummary): string {
  if (!summary.period) {
    return MARKETING_DASHBOARD_PERIOD_LABELS.all;
  }
  const from = new Date(summary.period.dateFrom);
  const to = new Date(summary.period.dateTo);
  return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
}
