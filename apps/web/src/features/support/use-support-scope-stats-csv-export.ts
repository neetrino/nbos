'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadSupportScopeStatsCsv } from '@/features/support/utils/export-support-scope-stats-csv';
import type { SupportStats } from '@/lib/api/support';

export function useSupportScopeStatsCsvExport(stats: SupportStats | null) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Support statistics are not loaded yet.');
      return;
    }
    downloadSupportScopeStatsCsv(stats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported support scope statistics (CSV)');
  }, [stats]);

  return { handleExportScopeStatsCsv };
}
