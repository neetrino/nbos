'use client';

import { Download, Loader2, TableProperties } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('expenses');
  return (
    <PageSettingsSheet
      title={t('settings.title')}
      description={t('settings.description')}
      triggerAriaLabel={t('settings.triggerAria')}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        {t('actions.exportStats')}
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
        {t('actions.exportCsv')}
      </Button>
    </PageSettingsSheet>
  );
}
