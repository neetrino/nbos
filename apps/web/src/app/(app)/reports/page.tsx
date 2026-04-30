'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, Download, RefreshCw, Search } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportsDataQualityPanel } from '@/features/reports/components/ReportsDataQualityPanel';
import { ReportsSchedulePanel } from '@/features/reports/components/ReportsSchedulePanel';
import { financeReportsApi, type FinanceReportDefinition } from '@/lib/api/finance-reports';
import {
  reportsApi,
  type ReportDataQualityWarning,
  type ReportExportJob,
  type ReportSchedule,
} from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';

type ReportCategory = 'all' | 'finance' | 'scheduled' | 'exports' | 'quality';

const REPORT_CATEGORIES: Array<{ id: ReportCategory; label: string }> = [
  { id: 'all', label: 'All reports' },
  { id: 'finance', label: 'Finance' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'exports', label: 'Exports' },
  { id: 'quality', label: 'Data quality' },
];

function matchesSearch(definition: FinanceReportDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [definition.title, definition.description, ...definition.audience]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export default function ReportsPage() {
  const [definitions, setDefinitions] = useState<FinanceReportDefinition[]>([]);
  const [exportJobs, setExportJobs] = useState<ReportExportJob[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [dataQualityWarnings, setDataQualityWarnings] = useState<ReportDataQualityWarning[]>([]);
  const [category, setCategory] = useState<ReportCategory>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingExportKey, setCreatingExportKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [definitionResponse, jobs, scheduledReports, quality] = await Promise.all([
        financeReportsApi.getDefinitions(),
        reportsApi.listExportJobs(),
        reportsApi.listSchedules(),
        reportsApi.listDataQualityWarnings(),
      ]);
      setDefinitions(definitionResponse.items);
      setExportJobs(jobs);
      setSchedules(scheduledReports);
      setDataQualityWarnings(quality.items);
    } catch (caught) {
      setDefinitions([]);
      setExportJobs([]);
      setSchedules([]);
      setDataQualityWarnings([]);
      setError(getApiErrorMessage(caught, 'Reports catalog could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleDefinitions = useMemo(() => {
    if (category !== 'all' && category !== 'finance') return [];
    return definitions.filter((definition) => matchesSearch(definition, search));
  }, [category, definitions, search]);

  async function requestExport(definition: FinanceReportDefinition) {
    setCreatingExportKey(definition.id);
    setError(null);
    try {
      const job = await reportsApi.createExportJob({
        reportKey: definition.id,
        ownerModule: 'FINANCE',
        format: 'CSV',
      });
      setExportJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setCategory('exports');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export job could not be requested.'));
    } finally {
      setCreatingExportKey(null);
    }
  }

  if (loading) return <LoadingState variant="cards" count={6} />;

  if (error) {
    return (
      <ErrorState title="Reports unavailable" description={error} onRetry={() => void load()} />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports / Analytics"
        description="Read-only catalog over module-owned report definitions. Reports links to source modules instead of copying business logic."
      >
        <Button type="button" variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="flex flex-wrap items-center gap-2">
            {REPORT_CATEGORIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={category === item.id ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="relative mt-4 max-w-xl">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report title, audience, definition..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="w-fit rounded-xl bg-sky-100 p-2.5 text-sky-700">
            <BarChart3 size={20} aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium">Catalog boundary</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Finance owns formulas and aggregate endpoints. Reports owns discovery, scheduling,
            exports and data-quality status.
          </p>
        </div>
      </section>

      {category === 'scheduled' ? (
        <ReportsSchedulePanel
          definitions={definitions}
          schedules={schedules}
          onSchedulesChange={setSchedules}
          onRefresh={() => void load()}
        />
      ) : category === 'exports' ? (
        <ExportHistory jobs={exportJobs} onRefresh={() => void load()} />
      ) : category === 'quality' ? (
        <ReportsDataQualityPanel warnings={dataQualityWarnings} onRefresh={() => void load()} />
      ) : visibleDefinitions.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-8 text-center">
          <BarChart3 className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No matching reports</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try a different search. Reports never invents analytics when source definitions are
            missing.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {visibleDefinitions.map((definition) => (
            <ReportCatalogCard
              key={definition.id}
              definition={definition}
              exporting={creatingExportKey === definition.id}
              onExport={() => void requestExport(definition)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ReportCatalogCard({
  definition,
  exporting,
  onExport,
}: {
  definition: FinanceReportDefinition;
  exporting: boolean;
  onExport: () => void;
}) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{definition.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Finance-owned
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CatalogBlock title="Audience" lines={definition.audience} />
        <CatalogBlock title="Definition" lines={[definition.phase3Scope]} />
        <CatalogBlock title="Data quality" lines={definition.sourceEndpoints} />
        <CatalogBlock title="Phase 6 later" lines={[definition.phase6Deferred]} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Requesting...' : 'Export CSV'}
        </Button>
        {definition.aggregateEndpoint ? (
          <Link
            href="/finance/reports"
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            Open Finance report
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        ) : null}
        {definition.drillDownHrefs.slice(0, 3).map((href) => (
          <Link
            key={href}
            href={href}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            {href}
          </Link>
        ))}
      </div>
    </article>
  );
}

function CatalogBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      <ul className="mt-1 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportHistory({ jobs, onRefresh }: { jobs: ReportExportJob[]; onRefresh: () => void }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Export history</p>
          <p className="text-muted-foreground text-sm">
            Jobs stay queued until a real Drive file is generated and audited.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <Download className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No export jobs yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Request an export from a report card. No fake files are created.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{job.reportTitle}</p>
                  <p className="text-muted-foreground text-sm">
                    {job.ownerModule} · {job.format} · queued{' '}
                    {new Date(job.queuedAt).toLocaleString()}
                  </p>
                </div>
                <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">
                  {job.status}
                </span>
              </div>
              {job.fileAsset ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  Drive file: {job.fileAsset.displayName}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
