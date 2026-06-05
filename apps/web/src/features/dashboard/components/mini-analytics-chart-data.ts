import type { DashboardData, MiniMetricDefinition } from '../dashboard-control-registry';
import type { AnalyticsBarItem } from '@/components/ui/analytics-card';

export function buildMiniAnalyticsChart(
  visibleMetrics: MiniMetricDefinition[],
  data: DashboardData | null,
): { bars: AnalyticsBarItem[]; totalAmount: string } {
  const bars: AnalyticsBarItem[] = visibleMetrics.map((metric) => {
    const raw = data?.[metric.key];
    const quantity = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return {
      label: metric.label,
      quantity,
      href: metric.href,
    };
  });

  const total = bars.reduce((sum, bar) => sum + bar.quantity, 0);

  return {
    bars,
    totalAmount: total.toLocaleString(),
  };
}
