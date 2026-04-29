'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadBonusScopeStatsCsv } from '@/features/finance/utils/export-bonus-scope-stats-csv';
import type { BonusStats } from '@/lib/api/bonus';

export function useBonusScopeStatsCsvExport(stats: BonusStats | null) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error(
        'Bonus statistics are not loaded for this view (try clearing the project filter).',
      );
      return;
    }
    downloadBonusScopeStatsCsv(stats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported bonus scope statistics (CSV)');
  }, [stats]);

  return { handleExportScopeStatsCsv };
}
