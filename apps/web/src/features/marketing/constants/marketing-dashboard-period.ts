/** Preset aligned with `04-Marketing-Analytics-and-KPI.md` time periods. */
export type MarketingDashboardPeriodPreset = 'all' | 'week' | 'month' | 'prev_month' | 'custom';

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(d: Date): Date {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
}

export interface MarketingDashboardQueryRange {
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds inclusive API query range. `all` returns `undefined` (server uses lifetime aggregates).
 */
export function getMarketingDashboardQueryRange(
  preset: MarketingDashboardPeriodPreset,
  custom?: { from: string; to: string },
): MarketingDashboardQueryRange | undefined {
  if (preset === 'all') {
    return undefined;
  }

  const now = new Date();

  if (preset === 'custom') {
    if (!custom?.from || !custom?.to) {
      return undefined;
    }
    const from = new Date(`${custom.from}T00:00:00`);
    const to = endOfDay(new Date(`${custom.to}T00:00:00`));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      return undefined;
    }
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }

  if (preset === 'week') {
    const from = startOfWeekMonday(now);
    return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
  }

  if (preset === 'month') {
    const from = startOfMonth(now);
    return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
  }

  const firstThisMonth = startOfMonth(now);
  const lastPrev = new Date(firstThisMonth);
  lastPrev.setDate(0);
  const from = startOfMonth(lastPrev);
  const to = endOfDay(lastPrev);
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

export const MARKETING_DASHBOARD_PERIOD_LABELS: Record<MarketingDashboardPeriodPreset, string> = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
  prev_month: 'Previous month',
  custom: 'Custom range',
};
