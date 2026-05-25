'use client';

import { Download, Loader2, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface FinanceListPageSettingsSheetProps {
  title: string;
  description: string;
  triggerAriaLabel: string;
  statsExportDisabled: boolean;
  exportCsvDisabled: boolean;
  exportCsvInProgress: boolean;
  onExportScopeStatsCsv: () => void;
  onExportCsv: () => void | Promise<void>;
  exportScopeStatsLabel?: string;
  exportCsvLabel?: string;
}

export function FinanceListPageSettingsSheet({
  title,
  description,
  triggerAriaLabel,
  statsExportDisabled,
  exportCsvDisabled,
  exportCsvInProgress,
  onExportScopeStatsCsv,
  onExportCsv,
  exportScopeStatsLabel = 'Export scope stats (CSV)',
  exportCsvLabel = 'Export list (CSV)',
}: FinanceListPageSettingsSheetProps) {
  return (
    <PageSettingsSheet title={title} description={description} triggerAriaLabel={triggerAriaLabel}>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        {exportScopeStatsLabel}
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
        {exportCsvLabel}
      </Button>
    </PageSettingsSheet>
  );
}
