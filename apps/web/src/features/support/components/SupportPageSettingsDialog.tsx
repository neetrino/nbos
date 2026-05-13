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

export type SupportPageSettingsDialogProps = {
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
};

/** Support page settings: scope stats CSV (same semantics as Tasks). */
export function SupportPageSettingsDialog({
  exportDisabled,
  onExportScopeStatsCsv,
}: SupportPageSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            aria-label="Support settings"
            className={props.className}
          >
            <Settings size={16} />
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support — settings</DialogTitle>
          <DialogDescription>
            Data exports and other page options. Scope stats are workspace-wide from the API; list
            filters are not applied to the export.
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
