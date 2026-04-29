'use client';

import { useState, useCallback } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { InvoiceListParams } from '@/lib/api/finance';
import { downloadInvoicesCsv } from '@/features/finance/utils/export-invoices-csv';
import { fetchAllInvoicesForExport } from '@/features/finance/utils/fetch-all-invoices-for-export';
import { toast } from 'sonner';

export function useInvoicesCsvExport(listParams: Omit<InvoiceListParams, 'page' | 'pageSize'>) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllInvoicesForExport(listParams);
      downloadInvoicesCsv(rows, {
        subscriptionId: listParams.subscriptionId,
      });
      toast.success(`Exported ${rows.length} invoice${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export invoices. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
