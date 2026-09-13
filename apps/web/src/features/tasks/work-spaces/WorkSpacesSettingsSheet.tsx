'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { WorkSpace } from '@/lib/api/tasks';
import { buildWorkSpacesCsvRows } from './work-spaces-csv-rows';
import { downloadCsvString, rowsToCsvString } from '@/lib/download-tabular-csv';

function downloadWorkSpacesListCsv(items: WorkSpace[]): void {
  const body = rowsToCsvString(buildWorkSpacesCsvRows(items));
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsvString(`work-spaces-${stamp}.csv`, body);
}

export function WorkSpacesSettingsSheet({ items }: { items: WorkSpace[] }) {
  const t = useTranslations('workSpaces');
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
        disabled={items.length === 0}
        onClick={() => downloadWorkSpacesListCsv(items)}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        {t('settings.exportCsv')}
      </Button>
    </PageSettingsSheet>
  );
}
