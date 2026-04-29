'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, BarChart3, RefreshCw } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  financeReportStatusClass,
  financeReportStatusLabel,
} from '@/features/finance/constants/finance-report-status';
import {
  CashFlowSnapshot,
  CompanyPnlSnapshot,
} from '@/features/finance/components/reports/FinanceReportSnapshots';
import { financeReportsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  financeReportsApi,
  type CashFlowReport,
  type CompanyPnlReport,
  type FinanceReportDefinition,
  type FinanceReportDefinitionsResponse,
} from '@/lib/api/finance-reports';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function FinanceReportsPage() {
  useFinanceDocumentTitle(financeReportsPageTitle());

  const [data, setData] = useState<FinanceReportDefinitionsResponse | null>(null);
  const [companyPnl, setCompanyPnl] = useState<CompanyPnlReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const [definitions, companyPnlReport, cashFlowReport] = await Promise.all([
        financeReportsApi.getDefinitions(),
        financeReportsApi.getCompanyPnl(),
        financeReportsApi.getCashFlow(),
      ]);
      setData(definitions);
      setCompanyPnl(companyPnlReport);
      setCashFlow(cashFlowReport);
      setError(null);
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Finance report definitions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDefinitions();
  }, [fetchDefinitions]);

  if (loading) return <LoadingState variant="cards" count={6} />;

  if (!data) {
    return (
      <ErrorState
        title="Finance reports unavailable"
        description={error ?? 'Could not load Finance report definitions.'}
        onRetry={fetchDefinitions}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance reports"
        description="Phase 3 v1 catalog for Finance-owned read-only report definitions."
      >
        <Button variant="outline" onClick={() => void fetchDefinitions()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <section className="border-border bg-card rounded-2xl border p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
            <BarChart3 size={20} aria-hidden />
          </div>
          <div>
            <p className="text-foreground font-medium">{data.meta.scope}</p>
            <p className="text-muted-foreground mt-1 text-sm">{data.meta.phase6Boundary}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {companyPnl ? <CompanyPnlSnapshot report={companyPnl} /> : null}
        {cashFlow ? <CashFlowSnapshot report={cashFlow} /> : null}
        {data.items.map((definition) => (
          <ReportDefinitionCard key={definition.id} definition={definition} />
        ))}
      </section>
    </div>
  );
}

function ReportDefinitionCard({ definition }: { definition: FinanceReportDefinition }) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-foreground text-lg font-semibold">{definition.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${financeReportStatusClass(
            definition.v1Status,
          )}`}
        >
          {financeReportStatusLabel(definition.v1Status)}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoBlock title="Phase 3 scope" lines={[definition.phase3Scope]} />
        <InfoBlock title="Phase 6 deferred" lines={[definition.phase6Deferred]} />
        <InfoBlock title="Audience" lines={definition.audience} />
        <InfoBlock title="Source endpoints" lines={definition.sourceEndpoints} />
        {definition.aggregateEndpoint ? (
          <InfoBlock title="Aggregate endpoint" lines={[definition.aggregateEndpoint]} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {definition.drillDownHrefs.map((href) => (
          <Link
            key={href}
            href={href}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            {href}
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        ))}
      </div>
    </article>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-foreground text-sm">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
