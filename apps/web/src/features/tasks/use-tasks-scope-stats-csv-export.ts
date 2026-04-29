'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadTasksScopeStatsCsv } from '@/features/tasks/utils/export-tasks-scope-stats-csv';
import type { TaskStats } from '@/lib/api/tasks';

export function useTasksScopeStatsCsvExport(stats: TaskStats | null) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error('Task statistics are not loaded yet.');
      return;
    }
    downloadTasksScopeStatsCsv(stats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported task scope statistics (CSV)');
  }, [stats]);

  return { handleExportScopeStatsCsv };
}
