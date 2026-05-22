'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';
import { downloadSalaryBoardCsv } from '@/features/finance/utils/export-salary-board-csv';
import { getApiErrorMessage } from '@/lib/api-errors';

export function useSalaryBoardCsvExport(
  visibleEntries: SalaryBoardEntry[],
  monthRange: { monthFrom?: string; monthTo?: string },
) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(() => {
    if (visibleEntries.length === 0) {
      toast('No salary lines match the current filters.');
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadSalaryBoardCsv(visibleEntries, monthRange);
      toast.success(
        `Exported ${visibleEntries.length} visible line${visibleEntries.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export salary board CSV.'));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [monthRange, visibleEntries]);

  return { exportCsvSubmitting, handleExportCsv };
}
