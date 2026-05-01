'use client';

import { useState, useCallback } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { OrderListParams } from '@/lib/api/finance';
import { downloadOrdersCsv } from '@/features/finance/utils/export-orders-csv';
import { fetchAllOrdersForExport } from '@/features/finance/utils/fetch-all-orders-for-export';
import { toast } from 'sonner';

export function useOrdersCsvExport(listParams: Omit<OrderListParams, 'page' | 'pageSize'>) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllOrdersForExport(listParams);
      downloadOrdersCsv(rows, {
        partnerId: listParams.partnerId,
        gap: listParams.gap,
      });
      toast.success(`Exported ${rows.length} order${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(caught, 'Could not export orders. Check your connection and try again.'),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
