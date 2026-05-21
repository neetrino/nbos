'use client';

import { Download, Loader2, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface BonusBoardPageSettingsSheetProps {
  statsExportDisabled: boolean;
  exportCsvDisabled: boolean;
  exportCsvInProgress: boolean;
  onExportScopeStatsCsv: () => void;
  onExportCsv: () => void;
}

export function BonusBoardPageSettingsSheet({
  statsExportDisabled,
  exportCsvDisabled,
  exportCsvInProgress,
  onExportScopeStatsCsv,
  onExportCsv,
}: BonusBoardPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Bonus — settings"
      description="Exports for visible rows and workspace scope statistics."
      triggerAriaLabel="Bonus settings"
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
        onClick={() => onExportCsv()}
      >
        {exportCsvInProgress ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export visible rows (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
