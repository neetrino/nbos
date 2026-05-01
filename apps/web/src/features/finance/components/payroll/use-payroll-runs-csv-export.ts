'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { downloadPayrollRunsCsv } from '@/features/finance/utils/export-payroll-runs-csv';
import { fetchAllPayrollRunsForExport } from '@/features/finance/utils/fetch-all-payroll-runs-for-export';

export interface PayrollRunsCsvExportScope {
  status: PayrollRunStatus | 'ALL';
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
}

export function usePayrollRunsCsvExport(scope: PayrollRunsCsvExportScope) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const listParams = useMemo(
    () => ({
      sortBy: 'payrollMonth' as const,
      sortOrder: 'desc' as const,
      ...(scope.status === 'ALL' ? {} : { status: scope.status }),
      ...(scope.payrollMonthFrom ? { payrollMonthFrom: scope.payrollMonthFrom } : {}),
      ...(scope.payrollMonthTo ? { payrollMonthTo: scope.payrollMonthTo } : {}),
    }),
    [scope.status, scope.payrollMonthFrom, scope.payrollMonthTo],
  );

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllPayrollRunsForExport(listParams);
      downloadPayrollRunsCsv(rows, {
        statusScope: scope.status,
        payrollMonthFrom: scope.payrollMonthFrom,
        payrollMonthTo: scope.payrollMonthTo,
      });
      toast.success(`Exported ${rows.length} payroll run${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export payroll runs. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams, scope.payrollMonthFrom, scope.payrollMonthTo, scope.status]);

  return { exportCsvSubmitting, handleExportCsv };
}
