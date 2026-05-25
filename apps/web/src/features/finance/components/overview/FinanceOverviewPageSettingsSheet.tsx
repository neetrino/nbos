'use client';

import { Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface FinanceOverviewPageSettingsSheetProps {
  title: string;
  description: string;
  triggerAriaLabel: string;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  onExportCsv?: () => void;
  exportCsvDisabled?: boolean;
  exportCsvInProgress?: boolean;
  exportCsvLabel?: string;
}

export function FinanceOverviewPageSettingsSheet({
  title,
  description,
  triggerAriaLabel,
  onRefresh,
  refreshDisabled = false,
  onExportCsv,
  exportCsvDisabled = false,
  exportCsvInProgress = false,
  exportCsvLabel = 'Export snapshot (CSV)',
}: FinanceOverviewPageSettingsSheetProps) {
  return (
    <PageSettingsSheet title={title} description={description} triggerAriaLabel={triggerAriaLabel}>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={refreshDisabled}
        onClick={() => onRefresh()}
      >
        <RefreshCw className="size-4 shrink-0" aria-hidden />
        Refresh data
      </Button>
      {onExportCsv ? (
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
          {exportCsvLabel}
        </Button>
      ) : null}
    </PageSettingsSheet>
  );
}
