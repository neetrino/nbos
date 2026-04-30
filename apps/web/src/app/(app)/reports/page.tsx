'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, CalendarClock, Download, RefreshCw, Search } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { financeReportsApi, type FinanceReportDefinition } from '@/lib/api/finance-reports';
import { getApiErrorMessage } from '@/lib/api-errors';

type ReportCategory = 'all' | 'finance' | 'scheduled' | 'exports';

const REPORT_CATEGORIES: Array<{ id: ReportCategory; label: string }> = [
  { id: 'all', label: 'All reports' },
  { id: 'finance', label: 'Finance' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'exports', label: 'Exports' },
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
  const [category, setCategory] = useState<ReportCategory>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await financeReportsApi.getDefinitions();
      setDefinitions(response.items);
    } catch (caught) {
      setDefinitions([]);
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

      {category === 'scheduled' || category === 'exports' ? (
        <HonestMissingState category={category} />
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
            <ReportCatalogCard key={definition.id} definition={definition} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReportCatalogCard({ definition }: { definition: FinanceReportDefinition }) {
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

function HonestMissingState({ category }: { category: 'scheduled' | 'exports' }) {
  const isScheduled = category === 'scheduled';
  const Icon = isScheduled ? CalendarClock : Download;
  return (
    <div className="border-border bg-card rounded-2xl border p-8 text-center">
      <Icon className="text-muted-foreground mx-auto h-8 w-8" />
      <p className="mt-3 font-medium">
        {isScheduled ? 'Scheduled reports are not wired yet' : 'Report exports are not wired yet'}
      </p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-xl text-sm">
        {isScheduled
          ? 'The catalog is ready to host scheduled reports, but owner, recipients, next run and failure handling still belong to a later Phase 6 slice.'
          : 'Exports must create audited Drive files. This screen keeps the state honest until export jobs are implemented.'}
      </p>
    </div>
  );
}
