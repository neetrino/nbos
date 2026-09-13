'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { WorkspaceAiAccessPanel } from '@/features/ai-admin/components/WorkspaceAiAccessPanel';
import type { Task } from '@/lib/api/tasks';
import { PermissionGate } from '@/lib/permissions';
import { buildWorkspaceTasksCsvRows } from './work-spaces-csv-rows';
import { downloadCsvString, rowsToCsvString } from '@/lib/download-tabular-csv';

function slugForFilename(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s.length > 0 ? s : 'workspace';
}

export type WorkSpaceDetailSettingsSheetProps = {
  workspaceId: string;
  workspaceName: string;
  tasks: Task[];
  onEditWorkSpace: () => void;
};

export function WorkSpaceDetailSettingsSheet({
  workspaceId,
  workspaceName,
  tasks,
  onEditWorkSpace,
}: WorkSpaceDetailSettingsSheetProps) {
  const t = useTranslations('workSpaces');
  const [open, setOpen] = useState(false);

  const exportTasks = () => {
    const body = rowsToCsvString(buildWorkspaceTasksCsvRows(tasks));
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = slugForFilename(workspaceName);
    downloadCsvString(`tasks-${slug}-${stamp}.csv`, body);
  };

  return (
    <PageSettingsSheet
      title={t('detailSettings.title')}
      description={t('detailSettings.description')}
      triggerAriaLabel={t('detailSettings.triggerAria')}
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        onClick={() => {
          setOpen(false);
          onEditWorkSpace();
        }}
      >
        <Pencil className="size-4 shrink-0" aria-hidden />
        {t('detailSettings.edit')}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={tasks.length === 0}
        onClick={() => exportTasks()}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        {t('detailSettings.exportTasks')}
      </Button>
      <PermissionGate module="COMPANY" action="EDIT">
        <WorkspaceAiAccessPanel workspaceId={workspaceId} />
      </PermissionGate>
    </PageSettingsSheet>
  );
}
