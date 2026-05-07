'use client';

import { Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { WorkSpace } from '@/lib/api/tasks';

import { buildWorkSpacesCsvRows } from './work-spaces-csv-rows';
import { downloadCsvString, rowsToCsvString } from '@/lib/download-tabular-csv';

function downloadWorkSpacesListCsv(items: WorkSpace[]): void {
  const body = rowsToCsvString(buildWorkSpacesCsvRows(items));
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsvString(`work-spaces-${stamp}.csv`, body);
}

/** Directory page: export current list snapshot as CSV. */
export function WorkSpacesSettingsDialog({ items }: { items: WorkSpace[] }) {
  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            aria-label="Work Spaces settings"
            className={props.className}
          >
            <Settings size={16} />
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Work Spaces — settings</DialogTitle>
          <DialogDescription>
            Options for this directory. The CSV is built from the spaces currently loaded on this
            page (not a separate API export).
          </DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          disabled={items.length === 0}
          onClick={() => downloadWorkSpacesListCsv(items)}
        >
          <Download size={16} />
          Download visible list (CSV)
        </Button>
      </DialogContent>
    </Dialog>
  );
}
