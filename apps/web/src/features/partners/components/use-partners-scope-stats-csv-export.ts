'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadPartnersScopeStatsCsv } from '@/features/partners/utils/export-partners-scope-stats-csv';
import type { PartnerStats } from '@/lib/api/partners';

export function usePartnersScopeStatsCsvExport(stats: PartnerStats | null) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Partner statistics are not loaded yet.');
      return;
    }
    downloadPartnersScopeStatsCsv(stats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported partner scope statistics (CSV)');
  }, [stats]);

  return { handleExportScopeStatsCsv };
}
