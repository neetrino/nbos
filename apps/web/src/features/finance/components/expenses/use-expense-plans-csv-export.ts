'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { downloadExpensePlansCsv } from '@/features/finance/utils/export-expense-plans-csv';
import { fetchAllExpensePlansForExport } from '@/features/finance/utils/fetch-all-expense-plans-for-export';
import type { ExpensePlanListParams } from '@/lib/api/expense-plans';

export function useExpensePlansCsvExport(
  listParams: Omit<ExpensePlanListParams, 'page' | 'pageSize'>,
) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllExpensePlansForExport(listParams);
      downloadExpensePlansCsv(rows);
      toast.success(`Exported ${rows.length} expense plan${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export expense plans. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
