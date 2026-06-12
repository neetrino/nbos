'use client';

import { ArrowLeft, Download, Loader2, TableProperties, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { EntityLifecycleScope } from '@nbos/shared';

export interface PartnersPageSettingsSheetProps {
  listScope: EntityLifecycleScope;
  onListScopeChange: (scope: EntityLifecycleScope) => void;
  exportDisabled: boolean;
  exportInProgress: boolean;
  statsExportDisabled: boolean;
  onExportCsv: () => void | Promise<void>;
  onExportScopeStatsCsv: () => void;
}

export function PartnersPageSettingsSheet({
  listScope,
  onListScopeChange,
  exportDisabled,
  exportInProgress,
  statsExportDisabled,
  onExportCsv,
  onExportScopeStatsCsv,
}: PartnersPageSettingsSheetProps) {
  const isTrashList = listScope === 'trash';

  const handleScopeChange = (scope: EntityLifecycleScope) => {
    onListScopeChange(scope);
  };

  return (
    <PageSettingsSheet
      title="Partners — settings"
      description={
        isTrashList
          ? 'Trash view. Restore partners from the list or return to the active directory.'
          : 'Active directory, CSV exports, and workspace-wide statistics.'
      }
      triggerAriaLabel="Partners settings"
    >
      {isTrashList ? (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => handleScopeChange('active')}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to active list
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => handleScopeChange('trash')}
        >
          <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
          View Trash
        </Button>
      )}
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
