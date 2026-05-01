'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadPayrollRunsScopeStatsCsv } from '@/features/finance/utils/export-payroll-runs-scope-stats-csv';
import type { PayrollRunStats } from '@/lib/api/payroll-runs';
import type { PayrollRunsCsvExportScope } from '@/features/finance/components/payroll/use-payroll-runs-csv-export';

export function usePayrollRunsScopeStatsCsvExport(
  stats: PayrollRunStats | null,
  scope: PayrollRunsCsvExportScope,
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Scope statistics are not loaded yet.');
      return;
    }
    downloadPayrollRunsScopeStatsCsv(stats, {
      statusScope: scope.status,
      payrollMonthFrom: scope.payrollMonthFrom,
      payrollMonthTo: scope.payrollMonthTo,
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported payroll scope statistics (CSV)');
  }, [scope.payrollMonthFrom, scope.payrollMonthTo, scope.status, stats]);

  return { handleExportScopeStatsCsv };
}
