'use client';

import { Download, Loader2, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface PartnersPageSettingsSheetProps {
  exportDisabled: boolean;
  exportInProgress: boolean;
  statsExportDisabled: boolean;
  onExportCsv: () => void | Promise<void>;
  onExportScopeStatsCsv: () => void;
}

export function PartnersPageSettingsSheet({
  exportDisabled,
  exportInProgress,
  statsExportDisabled,
  onExportCsv,
  onExportScopeStatsCsv,
}: PartnersPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Partners — settings"
      description="CSV exports for the partner directory and workspace-wide statistics."
      triggerAriaLabel="Partners settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        Export scope statistics (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportDisabled}
        onClick={() => {
          void onExportCsv();
        }}
      >
        {exportInProgress ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export partners (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
