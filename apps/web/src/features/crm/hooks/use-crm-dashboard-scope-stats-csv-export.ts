'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadCrmDashboardScopeStatsCsv } from '@/features/crm/utils/export-crm-dashboard-scope-stats-csv';
import type { LeadStats } from '@/lib/api/leads';
import type { DealStats } from '@/lib/api/deals';

export function useCrmDashboardScopeStatsCsvExport(
  leadStats: LeadStats | null,
  dealStats: DealStats | null,
) {
  const handleExportScopeStatsCsv = useCallback(() => {
    if (!leadStats || !dealStats) {
      toast.error('CRM statistics are not loaded yet.');
      return;
    }
    downloadCrmDashboardScopeStatsCsv(leadStats, dealStats, {
      exportedAtIso: new Date().toISOString(),
    });
    toast.success('Exported CRM dashboard scope statistics (CSV)');
  }, [dealStats, leadStats]);

  return { handleExportScopeStatsCsv };
}
