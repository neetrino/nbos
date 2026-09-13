'use client';

import { Download, Loader2, RefreshCcw, TableProperties } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('payroll');
  return (
    <PageSettingsSheet
      title={t('settings.title')}
      description={t('settings.description')}
      triggerAriaLabel={t('settings.aria')}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={refreshDisabled}
        onClick={() => void onRefresh()}
      >
        <RefreshCcw className="size-4 shrink-0" aria-hidden />
        {t('settings.refresh')}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        {t('settings.exportStats')}
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
        {t('settings.exportRuns')}
      </Button>
    </PageSettingsSheet>
  );
}
