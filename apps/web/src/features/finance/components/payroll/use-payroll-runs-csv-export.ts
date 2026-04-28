'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { downloadPayrollRunsCsv } from '@/features/finance/utils/export-payroll-runs-csv';
import { fetchAllPayrollRunsForExport } from '@/features/finance/utils/fetch-all-payroll-runs-for-export';

export function usePayrollRunsCsvExport(statusFilter: PayrollRunStatus | 'ALL') {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const listParams = useMemo(
    () => ({
      sortBy: 'payrollMonth' as const,
      sortOrder: 'desc' as const,
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
    }),
    [statusFilter],
  );

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllPayrollRunsForExport(listParams);
      downloadPayrollRunsCsv(rows, { statusScope: statusFilter });
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
  }, [listParams, statusFilter]);

  return { exportCsvSubmitting, handleExportCsv };
}
