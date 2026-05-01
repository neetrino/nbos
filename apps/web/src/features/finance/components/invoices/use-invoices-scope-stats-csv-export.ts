'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadInvoicesScopeStatsCsv } from '@/features/finance/utils/export-invoices-scope-stats-csv';
import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { InvoiceStats } from '@/lib/api/finance';

export function useInvoicesScopeStatsCsvExport(
  stats: InvoiceStats | null,
  options: {
    period: FinancePeriod;
    dateFrom?: string;
    dateTo?: string;
    subscriptionId?: string;
  },
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Invoice statistics are not loaded yet.');
      return;
    }
    downloadInvoicesScopeStatsCsv(stats, {
      period: options.period,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      subscriptionId: options.subscriptionId,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported invoice scope statistics (CSV)');
  }, [options.dateFrom, options.dateTo, options.period, options.subscriptionId, stats]);

  return { handleExportScopeStatsCsv };
}
