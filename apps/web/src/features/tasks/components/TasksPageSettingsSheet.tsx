'use client';

import Link from 'next/link';
import { ArrowLeft, Repeat, TableProperties, Trash2, Workflow } from 'lucide-react';
import type { EntityLifecycleScope } from '@nbos/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { useTranslations } from 'next-intl';

export type TasksPageSettingsSheetProps = {
  listScope: EntityLifecycleScope;
  onListScopeChange: (scope: EntityLifecycleScope) => void;
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
};

export function TasksPageSettingsSheet({
  listScope,
  onListScopeChange,
  exportDisabled,
  onExportScopeStatsCsv,
}: TasksPageSettingsSheetProps) {
  const t = useTranslations('tasks');
  const isTrashList = listScope === 'trash';

  return (
    <PageSettingsSheet
      title={t('settings.title')}
      description={isTrashList ? t('settings.trashDescription') : t('settings.description')}
      triggerAriaLabel={t('settings.triggerAria')}
    >
      {isTrashList ? (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => onListScopeChange('active')}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          {t('settings.backToActive')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => onListScopeChange('trash')}
        >
          <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
          {t('settings.viewTrash')}
        </Button>
      )}
      <Link
        href="/tasks/recurring"
        className={buttonVariants({ variant: 'outline', className: 'justify-start gap-2' })}
      >
        <Repeat className="size-4 shrink-0" aria-hidden />
        {t('settings.recurring')}
      </Link>
      <Link
        href="/tasks/automation"
        className={buttonVariants({ variant: 'outline', className: 'justify-start gap-2' })}
      >
        <Workflow className="size-4 shrink-0" aria-hidden />
        {t('settings.automation')}
      </Link>
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
