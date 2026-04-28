'use client';

import { useState, useCallback } from 'react';
import type { ExpenseListParams } from '@/lib/api/finance';
import { downloadExpensesCsv } from '@/features/finance/utils/export-expenses-csv';
import { fetchAllExpensesForExport } from '@/features/finance/utils/fetch-all-expenses-for-export';
import { toast } from 'sonner';

export function useExpenseCsvExport(listParams: Omit<ExpenseListParams, 'page' | 'pageSize'>) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllExpensesForExport(listParams);
      downloadExpensesCsv(rows);
      toast.success(`Exported ${rows.length} expense${rows.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('Could not export expenses. Check your connection and try again.');
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
