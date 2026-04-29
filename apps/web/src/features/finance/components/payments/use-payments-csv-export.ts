'use client';

import { useState, useCallback } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PaymentListParams } from '@/lib/api/finance';
import { downloadPaymentsCsv } from '@/features/finance/utils/export-payments-csv';
import { fetchAllPaymentsForExport } from '@/features/finance/utils/fetch-all-payments-for-export';
import { toast } from 'sonner';

export function usePaymentsCsvExport(listParams: Omit<PaymentListParams, 'page' | 'pageSize'>) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllPaymentsForExport(listParams);
      downloadPaymentsCsv(rows);
      toast.success(`Exported ${rows.length} payment${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export payments. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
