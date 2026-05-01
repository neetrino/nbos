'use client';

import { useState, useCallback } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { SubscriptionListParams } from '@/lib/api/subscriptions';
import { downloadSubscriptionsCsv } from '@/features/finance/utils/export-subscriptions-csv';
import { fetchAllSubscriptionsForExport } from '@/features/finance/utils/fetch-all-subscriptions-for-export';
import { toast } from 'sonner';

export function useSubscriptionsCsvExport(
  listParams: Omit<SubscriptionListParams, 'page' | 'pageSize'>,
) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllSubscriptionsForExport(listParams);
      downloadSubscriptionsCsv(rows, {
        partnerId: listParams.partnerId,
      });
      toast.success(`Exported ${rows.length} subscription${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export subscriptions. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
