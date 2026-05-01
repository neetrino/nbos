'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadPaymentsScopeStatsCsv } from '@/features/finance/utils/export-payments-scope-stats-csv';
import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { PaymentStats } from '@/lib/api/finance';

export function usePaymentsScopeStatsCsvExport(
  stats: PaymentStats | null,
  options: {
    period: FinancePeriod;
    dateFrom?: string;
    dateTo?: string;
  },
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Payment statistics are not loaded yet.');
      return;
    }
    downloadPaymentsScopeStatsCsv(stats, {
      period: options.period,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported payment scope statistics (CSV)');
  }, [options.dateFrom, options.dateTo, options.period, stats]);

  return { handleExportScopeStatsCsv };
}
