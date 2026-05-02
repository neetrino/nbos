'use client';

import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportDefinition } from '@/lib/api/reports';
import type { ReportPreviewData } from '../report-preview-model';
import { formatReportFilters } from '../report-filters';
import { ReportPreview } from './ReportPreview';

interface ReportCatalogProps {
  definitions: ReportDefinition[];
  filters: Record<string, string>;
  previewData: ReportPreviewData;
  creatingExportKey: string | null;
  onExport: (definition: ReportDefinition) => void;
}

export function ReportCatalog({
  definitions,
  filters,
  previewData,
  creatingExportKey,
  onExport,
}: ReportCatalogProps) {
  if (definitions.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-8 text-center">
        <p className="font-medium">No matching reports</p>
        <p className="text-muted-foreground mt-1 text-sm">Try another category or search query.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {definitions.map((definition) => (
        <ReportCard
          key={definition.key}
          definition={definition}
          filters={filters}
          previewData={previewData}
          exporting={creatingExportKey === definition.key}
          onExport={() => onExport(definition)}
        />
      ))}
    </section>
  );
}

function ReportCard({
  definition,
  filters,
  previewData,
  exporting,
  onExport,
}: {
  definition: ReportDefinition;
  filters: Record<string, string>;
  previewData: ReportPreviewData;
  exporting: boolean;
  onExport: () => void;
}) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{definition.title}</p>
            <StatusPill status={definition.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
        </div>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
          {definition.category}
        </span>
      </div>

      <ReportPreview definition={definition} previewData={previewData} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Requesting...' : 'Export CSV'}
        </Button>
        {definition.drillDownHrefs.slice(0, 3).map((href) => (
          <Link
            key={href}
            href={href}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            {linkLabel(href)}
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoBlock title="Audience" lines={definition.audience} />
        <InfoBlock title="Visuals" lines={definition.visualizations.map(formatToken)} />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        Export filters: {formatReportFilters(filters)}
      </p>
    </article>
  );
}

function StatusPill({ status }: { status: ReportDefinition['status'] }) {
  const className =
    status === 'READY' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{status}</span>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      <ul className="mt-1 space-y-1">
        {lines.slice(0, 3).map((line) => (
          <li key={line} className="text-sm">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function linkLabel(href: string): string {
  if (href === '/finance/reports') return 'Open finance reports';
  return href.replace('/', '').replaceAll('/', ' / ') || 'Open source';
}

function formatToken(value: string): string {
  return value.replaceAll('_', ' ');
}
