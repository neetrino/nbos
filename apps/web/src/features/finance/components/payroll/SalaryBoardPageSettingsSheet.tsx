'use client';

import { Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('payroll');
  return (
    <PageSettingsSheet
      title={t('salary.settingsTitle')}
      description={t('salary.settingsDescription')}
      triggerAriaLabel={t('salary.settingsAria')}
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
        {t('salary.exportCsv')}
      </Button>
    </PageSettingsSheet>
  );
}
