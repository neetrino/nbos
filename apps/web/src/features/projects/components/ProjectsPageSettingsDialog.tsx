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
import type { Project } from '@/lib/api/projects';
import { downloadCsvString, rowsToCsvString } from '@/lib/download-tabular-csv';

import { buildProjectsHubCsvRows } from '../utils/projects-hub-csv-rows';

function downloadProjectsListCsv(items: Project[]): void {
  const body = rowsToCsvString(buildProjectsHubCsvRows(items));
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsvString(`projects-${stamp}.csv`, body);
}

export function ProjectsPageSettingsDialog({ items }: { items: Project[] }) {
  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            aria-label="Project Hub settings"
            className={props.className}
          >
            <Settings size={16} />
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Hub — settings</DialogTitle>
          <DialogDescription>
            Options for this directory. The CSV reflects projects currently loaded on this page.
          </DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          disabled={items.length === 0}
          onClick={() => downloadProjectsListCsv(items)}
        >
          <Download size={16} />
          Download visible list (CSV)
        </Button>
      </DialogContent>
    </Dialog>
  );
}
