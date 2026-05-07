'use client';

import { Settings, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type TasksPageSettingsDialogProps = {
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
};

/** Tasks page settings modal: scope stats CSV; add more actions here later. */
export function TasksPageSettingsDialog({
  exportDisabled,
  onExportScopeStatsCsv,
}: TasksPageSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tasks settings"
            className={props.className}
          >
            <Settings size={16} />
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tasks — settings</DialogTitle>
          <DialogDescription>
            Data exports and other page options. Scope stats reflect workspace-wide aggregates from
            the API; they do not apply current list filters.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            disabled={exportDisabled}
            onClick={() => onExportScopeStatsCsv()}
          >
            <TableProperties size={16} />
            Export scope stats (CSV)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
