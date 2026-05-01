'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadOrdersScopeStatsCsv } from '@/features/finance/utils/export-orders-scope-stats-csv';
import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { OrderStats, OrderStatsQueryParams } from '@/lib/api/finance';

export function useOrdersScopeStatsCsvExport(
  stats: OrderStats | null,
  options: {
    period: FinancePeriod;
    statsQuery: OrderStatsQueryParams;
  },
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Order statistics are not loaded yet.');
      return;
    }
    downloadOrdersScopeStatsCsv(stats, {
      period: options.period,
      statsQuery: options.statsQuery,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported order scope statistics (CSV)');
  }, [options.period, options.statsQuery, stats]);

  return { handleExportScopeStatsCsv };
}
