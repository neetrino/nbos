'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { downloadBonusBoardCsv } from '@/features/finance/utils/export-bonus-board-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { BonusEntryListRow } from '@/lib/api/bonus';

/**
 * @param serverProjectId When set, matches `GET /api/bonus?projectId=` scope used to load rows.
 */
export function useBonusBoardCsvExport(
  visibleRows: BonusEntryListRow[],
  serverProjectId: string | undefined,
) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);

  const handleExportCsv = useCallback(() => {
    if (visibleRows.length === 0) {
      toast('No bonus rows match the current filters.');
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadBonusBoardCsv(visibleRows, { serverProjectId });
      toast.success(
        `Exported ${visibleRows.length} visible bonus row${visibleRows.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export bonus board CSV.'));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [serverProjectId, visibleRows]);

  return { exportCsvSubmitting, handleExportCsv };
}
