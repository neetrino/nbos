'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportDefinition, ReportExportFormat } from '@/lib/api/reports';

interface ReportActionsProps {
  definitions: ReportDefinition[];
  creatingExportToken: string | null;
  onExport: (definition: ReportDefinition, format: ReportExportFormat) => void;
}

export function ReportActions({ definitions, creatingExportToken, onExport }: ReportActionsProps) {
  if (definitions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No reports match the current search or filters.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {definitions.map((definition) => (
        <li key={definition.key} className="border-border/80 bg-muted/30 rounded-xl border p-3">
          <p className="text-sm leading-snug font-medium">{definition.title}</p>
          <p className="text-muted-foreground mt-1 truncate text-xs">{definition.description}</p>
          <ReportExportButtons
            definition={definition}
            creatingExportToken={creatingExportToken}
            onExport={onExport}
          />
        </li>
      ))}
    </ul>
  );
}

function ReportExportButtons({
  definition,
  creatingExportToken,
  onExport,
}: {
  definition: ReportDefinition;
  creatingExportToken: string | null;
  onExport: (definition: ReportDefinition, format: ReportExportFormat) => void;
}) {
  if (definition.supportedExports.length === 0) {
    return <p className="text-muted-foreground mt-3 text-xs">No export formats available.</p>;
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {definition.supportedExports.map((format) => {
        const token = `${definition.key}:${format}`;
        const loading = creatingExportToken === token;
        return (
          <Button
            key={`${definition.key}-${format}`}
            type="button"
            size="sm"
            variant="secondary"
            disabled={creatingExportToken !== null}
            onClick={() => onExport(definition, format)}
            className="h-9 w-full justify-center gap-1.5 px-3 text-xs"
          >
            <Download className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{loading ? '…' : format}</span>
          </Button>
        );
      })}
    </div>
  );
}
