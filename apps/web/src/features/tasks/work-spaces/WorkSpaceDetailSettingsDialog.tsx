'use client';

import { Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@/lib/api/tasks';

import { buildWorkspaceTasksCsvRows } from './work-spaces-csv-rows';
import { downloadCsvString, rowsToCsvString } from './download-tabular-csv';

function slugForFilename(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s.length > 0 ? s : 'workspace';
}

export type WorkSpaceDetailSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  tasks: Task[];
  onEditWorkSpace: () => void;
};

export function WorkSpaceDetailSettingsDialog({
  open,
  onOpenChange,
  workspaceName,
  tasks,
  onEditWorkSpace,
}: WorkSpaceDetailSettingsDialogProps) {
  const exportTasks = () => {
    const body = rowsToCsvString(buildWorkspaceTasksCsvRows(tasks));
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = slugForFilename(workspaceName);
    downloadCsvString(`tasks-${slug}-${stamp}.csv`, body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Work space — settings</DialogTitle>
          <DialogDescription>
            Edit this space or export the tasks currently loaded on this page as CSV.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => {
              onOpenChange(false);
              onEditWorkSpace();
            }}
          >
            <Pencil size={16} />
            Edit work space
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            disabled={tasks.length === 0}
            onClick={() => exportTasks()}
          >
            <Download size={16} />
            Export tasks (CSV)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
