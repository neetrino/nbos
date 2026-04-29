'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadSubscriptionsScopeStatsCsv } from '@/features/finance/utils/export-subscriptions-scope-stats-csv';
import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { SubscriptionStats, SubscriptionStatsQueryParams } from '@/lib/api/subscriptions';

export function useSubscriptionsScopeStatsCsvExport(
  stats: SubscriptionStats | null,
  options: {
    period: FinancePeriod;
    statsQuery: SubscriptionStatsQueryParams;
  },
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Subscription statistics are not loaded yet.');
      return;
    }
    downloadSubscriptionsScopeStatsCsv(stats, {
      period: options.period,
      statsQuery: options.statsQuery,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported subscription scope statistics (CSV)');
  }, [options.period, options.statsQuery, stats]);

  return { handleExportScopeStatsCsv };
}
