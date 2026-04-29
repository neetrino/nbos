'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadExpensesScopeStatsCsv } from '@/features/finance/utils/export-expenses-scope-stats-csv';
import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { ExpenseStats, ExpenseStatsQueryParams } from '@/lib/api/finance';

export function useExpensesScopeStatsCsvExport(
  stats: ExpenseStats | null,
  options: {
    period: FinancePeriod;
    statsQuery: ExpenseStatsQueryParams;
  },
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Expense statistics are not loaded yet.');
      return;
    }
    downloadExpensesScopeStatsCsv(stats, {
      period: options.period,
      statsQuery: options.statsQuery,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported expense scope statistics (CSV)');
  }, [options.period, options.statsQuery, stats]);

  return { handleExportScopeStatsCsv };
}
