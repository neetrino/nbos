'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { downloadSupportScopeStatsCsv } from '@/features/support/utils/export-support-scope-stats-csv';
import type { SupportStats } from '@/lib/api/support';

export function useSupportScopeStatsCsvExport(stats: SupportStats | null) {
  const t = useTranslations('support');
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!stats) {
      toast.error(t('errors.statsNotLoaded'));
      return;
    }
    downloadSupportScopeStatsCsv(stats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success(t('errors.exportCsvSuccess'));
  }, [stats, t]);

  return { handleExportScopeStatsCsv };
}
