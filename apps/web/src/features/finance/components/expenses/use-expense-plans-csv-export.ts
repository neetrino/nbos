'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlanListHasActiveFilters } from '@/features/finance/utils/build-expense-plan-list-api-params';
import { downloadExpensePlansCsv } from '@/features/finance/utils/export-expense-plans-csv';
import { fetchAllExpensePlansForExport } from '@/features/finance/utils/fetch-all-expense-plans-for-export';
import type { ExpensePlanListParams } from '@/lib/api/expense-plans';
import { useExpensePlansT } from './expense-plan-message-keys';

export function useExpensePlansCsvExport(
  listParams: Omit<ExpensePlanListParams, 'page' | 'pageSize'>,
) {
  const t = useExpensePlansT();
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllExpensePlansForExport(listParams);
      const hasActiveFilters = expensePlanListHasActiveFilters({
        search: listParams.search ?? '',
        category: listParams.category,
        projectId: listParams.projectId,
      });
      downloadExpensePlansCsv(rows, {
        hasActiveFilters,
        filenameHints: {
          category: listParams.category,
          projectId: listParams.projectId,
        },
      });
      toast.success(t('toasts.exported', { count: rows.length }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('errors.export')));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams, t]);

  return { exportCsvSubmitting, handleExportCsv };
}
