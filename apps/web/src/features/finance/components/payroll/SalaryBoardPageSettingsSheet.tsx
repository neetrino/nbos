'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export function SalaryBoardPageSettingsSheet({
  exportCsvDisabled,
  exportCsvInProgress,
  onExportCsv,
}: {
  exportCsvDisabled: boolean;
  exportCsvInProgress: boolean;
  onExportCsv: () => void;
}) {
  return (
    <PageSettingsSheet
      title="Salary — settings"
      description="Export visible salary lines (current filters and month range)."
      triggerAriaLabel="Salary settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportCsvDisabled}
        onClick={() => onExportCsv()}
      >
        {exportCsvInProgress ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export visible lines (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
