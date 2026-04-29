'use client';

import { useState, useCallback } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PartnerListParams } from '@/lib/api/partners';
import { downloadPartnersCsv } from '@/features/partners/utils/export-partners-csv';
import { fetchAllPartnersForExport } from '@/features/partners/utils/fetch-all-partners-for-export';
import { toast } from 'sonner';

export function usePartnersCsvExport(listParams: Omit<PartnerListParams, 'page' | 'pageSize'>) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExportCsvSubmitting(true);
    try {
      const rows = await fetchAllPartnersForExport(listParams);
      downloadPartnersCsv(rows);
      toast.success(`Exported ${rows.length} partner${rows.length === 1 ? '' : 's'}`);
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Could not export partners. Check your connection and try again.',
        ),
      );
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [listParams]);

  return { exportCsvSubmitting, handleExportCsv };
}
