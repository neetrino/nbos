'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { Project } from '@/lib/api/projects';
import { downloadCsvString, rowsToCsvString } from '@/lib/download-tabular-csv';
import { buildProjectsHubCsvRows } from '../utils/projects-hub-csv-rows';

function downloadProjectsListCsv(items: Project[]): void {
  const body = rowsToCsvString(buildProjectsHubCsvRows(items));
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsvString(`projects-${stamp}.csv`, body);
}

export function ProjectsPageSettingsSheet({ items }: { items: Project[] }) {
  return (
    <PageSettingsSheet
      title="Project Hub — settings"
      description="Options for this directory. The CSV reflects projects currently loaded on this page."
      triggerAriaLabel="Project Hub settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={items.length === 0}
        onClick={() => downloadProjectsListCsv(items)}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Download visible list (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
