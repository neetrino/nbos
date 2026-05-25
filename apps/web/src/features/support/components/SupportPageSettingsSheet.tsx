'use client';

import { TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface SupportPageSettingsSheetProps {
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
}

export function SupportPageSettingsSheet({
  exportDisabled,
  onExportScopeStatsCsv,
}: SupportPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Support — settings"
      description="Data exports and page options. Scope stats are workspace-wide from the API; list filters are not applied to the export."
      triggerAriaLabel="Support settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        Export scope stats (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
