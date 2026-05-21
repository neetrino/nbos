'use client';

import { Download, Loader2, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface ExpensesPageSettingsSheetProps {
  statsExportDisabled: boolean;
  exportCsvDisabled: boolean;
  exportCsvInProgress: boolean;
  onExportScopeStatsCsv: () => void;
  onExportCsv: () => void | Promise<void>;
}

export function ExpensesPageSettingsSheet({
  statsExportDisabled,
  exportCsvDisabled,
  exportCsvInProgress,
  onExportScopeStatsCsv,
  onExportCsv,
}: ExpensesPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Board — settings"
      description="Exports and scope statistics. Period and board scope follow the filters in the search bar."
      triggerAriaLabel="Board settings"
    >
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
        Export expenses (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
