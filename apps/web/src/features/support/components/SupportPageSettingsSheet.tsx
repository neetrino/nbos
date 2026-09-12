'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('support');

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
        disabled={exportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        {t('settings.exportCsv')}
      </Button>
    </PageSettingsSheet>
  );
}
