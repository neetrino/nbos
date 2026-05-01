'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { downloadPayrollSalaryLinesCsv } from '@/features/finance/utils/export-payroll-salary-lines-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollRunDetail } from '@/lib/api/payroll-runs';

export function usePayrollRunSalaryLinesCsvExport(run: PayrollRunDetail | null) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportSalaryLinesCsv = useCallback(() => {
    if (!run || run.salaryLines.length === 0) {
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadPayrollSalaryLinesCsv(run.salaryLines, {
        payrollRunId: run.id,
        payrollMonth: run.payrollMonth,
      });
      toast.success(
        `Exported ${run.salaryLines.length} salary line${run.salaryLines.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export salary lines CSV. Try again or contact support.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [run]);

  return { exportCsvSubmitting, handleExportSalaryLinesCsv };
}
