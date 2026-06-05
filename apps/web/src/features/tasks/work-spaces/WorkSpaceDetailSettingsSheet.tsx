'use client';

import { useState } from 'react';
import { Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { Task } from '@/lib/api/tasks';
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
  workspaceName: string;
  tasks: Task[];
  onEditWorkSpace: () => void;
};

export function WorkSpaceDetailSettingsSheet({
  workspaceName,
  tasks,
  onEditWorkSpace,
}: WorkSpaceDetailSettingsSheetProps) {
  const [open, setOpen] = useState(false);

  const exportTasks = () => {
    const body = rowsToCsvString(buildWorkspaceTasksCsvRows(tasks));
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = slugForFilename(workspaceName);
    downloadCsvString(`tasks-${slug}-${stamp}.csv`, body);
  };

  return (
    <PageSettingsSheet
      title="Work space — settings"
      description="Edit this space or export the tasks currently loaded on this page as CSV."
      triggerAriaLabel="Work space settings"
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
        Edit work space
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={tasks.length === 0}
        onClick={() => exportTasks()}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Export tasks (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
