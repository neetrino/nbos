'use client';

import { Download, Loader2, RefreshCcw, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface PayrollRunsPageSettingsSheetProps {
  refreshDisabled: boolean;
  statsExportDisabled: boolean;
  exportCsvDisabled: boolean;
  exportCsvInProgress: boolean;
  onRefresh: () => void;
  onExportScopeStatsCsv: () => void;
  onExportCsv: () => void | Promise<void>;
}

export function PayrollRunsPageSettingsSheet({
  refreshDisabled,
  statsExportDisabled,
  exportCsvDisabled,
  exportCsvInProgress,
  onRefresh,
  onExportScopeStatsCsv,
  onExportCsv,
}: PayrollRunsPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Payroll — settings"
      description="Refresh list data and export CSV for the current filter scope."
      triggerAriaLabel="Payroll settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={refreshDisabled}
        onClick={() => void onRefresh()}
      >
        <RefreshCcw className="size-4 shrink-0" aria-hidden />
        Refresh runs
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        Export scope stats (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportCsvDisabled}
        onClick={() => {
          void onExportCsv();
        }}
      >
        {exportCsvInProgress ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export payroll runs (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
