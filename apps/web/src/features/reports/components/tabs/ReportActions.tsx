'use client';

import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportDefinition, ReportExportFormat } from '@/lib/api/reports';

interface ReportActionsProps {
  definitions: ReportDefinition[];
  creatingExportToken: string | null;
  onExport: (definition: ReportDefinition, format: ReportExportFormat) => void;
}

export function ReportActions({ definitions, creatingExportToken, onExport }: ReportActionsProps) {
  if (definitions.length === 0) return null;

  return (
    <section className="border-border bg-card rounded-2xl border p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Report actions</h2>
        <p className="text-muted-foreground text-xs">Export and source links</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {definitions.map((definition) => (
          <div
            key={definition.key}
            className="border-border/80 flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2"
            title={definition.description}
          >
            <p className="min-w-0 truncate text-sm font-medium">{definition.title}</p>
            <div className="flex shrink-0 items-center gap-1.5">
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
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {loading ? '...' : format}
                  </Button>
                );
              })}
              {definition.drillDownHrefs.slice(0, 2).map((href) => (
                <Link
                  key={href}
                  href={href}
                  title={hrefLabel(href)}
                  className="border-border text-muted-foreground hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-lg border"
                >
                  <ArrowUpRight size={12} aria-hidden />
                  <span className="sr-only">{hrefLabel(href)}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function hrefLabel(href: string): string {
  return href.replace('/', '').replaceAll('/', ' / ') || 'Open source';
}
