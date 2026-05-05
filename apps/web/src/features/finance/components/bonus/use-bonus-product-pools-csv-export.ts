'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { downloadBonusProductPoolsCsv } from '@/features/finance/utils/export-bonus-product-pools-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

export function useBonusProductPoolsCsvExport(rows: BonusProductPoolRow[]) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(() => {
    if (rows.length === 0) {
      toast('No bonus pool rows to export.');
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadBonusProductPoolsCsv(rows);
      toast.success(
        `Exported ${rows.length} product pool roll-up${rows.length === 1 ? '' : 's'} (UTF-8 CSV)`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export bonus pool CSV.'));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [rows]);

  return { exportCsvSubmitting, handleExportCsv };
}
