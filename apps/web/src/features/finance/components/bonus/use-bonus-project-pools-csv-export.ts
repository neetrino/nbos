'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { downloadBonusProjectPoolsCsv } from '@/features/finance/utils/export-bonus-project-pools-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { BonusProjectPoolRow } from '@/lib/api/bonus';

export function useBonusProjectPoolsCsvExport(rows: BonusProjectPoolRow[]) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(() => {
    if (rows.length === 0) {
      toast('No bonus pool rows to export.');
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadBonusProjectPoolsCsv(rows);
      toast.success(
        `Exported ${rows.length} project roll-up${rows.length === 1 ? '' : 's'} (UTF-8 CSV)`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export bonus pool CSV.'));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [rows]);

  return { exportCsvSubmitting, handleExportCsv };
}
