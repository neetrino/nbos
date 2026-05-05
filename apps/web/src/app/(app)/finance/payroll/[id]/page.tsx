'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { payrollRunDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PayrollAuditTrailEntry } from '@/features/finance/components/payroll/PayrollAuditTrailEntry';
import { PayrollRunDetailActions } from '@/features/finance/components/payroll/PayrollRunDetailActions';
import { PayrollRunSalesKpiSection } from '@/features/finance/components/payroll/payroll-run-sales-kpi-section';
import { PayrollRunSalaryLinesTable } from '@/features/finance/components/payroll/PayrollRunSalaryLinesTable';
import { usePayrollRunJournalAuditCsvExport } from '@/features/finance/components/payroll/use-payroll-run-journal-audit-csv-export';
import { usePayrollRunSalaryLinesCsvExport } from '@/features/finance/components/payroll/use-payroll-run-salary-lines-csv-export';
import { payrollRunsListHref } from '@/features/finance/constants/payroll-runs-list-url';
import {
  PAYROLL_JOURNAL_KIND_LABEL,
  PAYROLL_RUN_STATUS_LABEL,
} from '@/features/finance/constants/payroll-run-ui';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatJournalAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function employeeName(emp: { firstName: string; lastName: string }): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export default function PayrollRunDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [run, setRun] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const { exportCsvSubmitting, handleExportSalaryLinesCsv } =
    usePayrollRunSalaryLinesCsvExport(run);
  const { journalSubmitting, auditSubmitting, handleExportJournalCsv, handleExportAuditCsv } =
    usePayrollRunJournalAuditCsvExport(run);

  useFinanceDocumentTitle(payrollRunDetailPageTitle(run?.payrollMonth));

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await payrollRunsApi.getById(id);
      setRun(data);
    } catch (caught) {
      setRun(null);
      setError(getApiErrorMessage(caught, 'Payroll run could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyStatus = useCallback(
    async (next: PayrollRunStatus) => {
      if (!id) return;
      setStatusBusy(true);
      setActionError(null);
      try {
        const updated = await payrollRunsApi.updateStatus(id, next);
        setRun(updated);
      } catch (caught) {
        setActionError(getApiErrorMessage(caught, 'Status could not be updated.'));
      } finally {
        setStatusBusy(false);
      }
    },
    [id],
  );

  if (!id) {
    return <ErrorState description="Invalid payroll run." />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingState />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/finance/payroll"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Back to payroll
        </Link>
        <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    );
  }

  const listHrefForRunMonth = payrollRunsListHref(undefined, {
    payrollMonthFrom: run.payrollMonth,
    payrollMonthTo: run.payrollMonth,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={listHrefForRunMonth}
            className="text-muted-foreground hover:text-foreground mb-2 -ml-2 inline-flex items-center gap-1 text-sm"
            title="Payroll list filtered to this calendar month"
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Payroll · {run.payrollMonth}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Status: {PAYROLL_RUN_STATUS_LABEL[run.status]}
            {run.salaryLines.length > 0
              ? ` · ${run.salaryLines.length} salary line(s) · ${run.materializedExpenseLineCount} expense card(s)`
              : ' · no salary lines'}
          </p>
        </div>
        <PayrollRunDetailActions
          run={run}
          onRefresh={load}
          salaryExportSubmitting={exportCsvSubmitting}
          onExportSalaryLines={handleExportSalaryLinesCsv}
          journalSubmitting={journalSubmitting}
          onExportJournal={handleExportJournalCsv}
          auditSubmitting={auditSubmitting}
          onExportAudit={handleExportAuditCsv}
          statusBusy={statusBusy}
          onApplyStatus={applyStatus}
        />
      </div>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {run.status === 'APPROVED' || run.status === 'PAYING' || run.status === 'CLOSED' ? (
        <p className="text-muted-foreground text-sm">
          Approved runs materialize one expense card per payable salary line (linked below). Pay via
          Finance → Expenses and partial payments as usual.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Summary label="Total base" value={formatAmount(parseAmount(run.totalBaseSalary))} />
        <Summary label="Bonuses" value={formatAmount(parseAmount(run.totalBonuses))} />
        <Summary label="Payable" value={formatAmount(parseAmount(run.totalPayable))} />
        <Summary label="Paid" value={formatAmount(parseAmount(run.totalPaid))} />
        <Summary
          label="Remaining"
          value={formatAmount(payrollRunRemainingMajorUnits(run.totalPayable, run.totalPaid))}
          accent
        />
      </div>

      <PayrollRunSalesKpiSection run={run} onUpdated={setRun} />

      {run.auditTrail.length > 0 ? (
        <section className="border-border bg-card rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">Audit trail</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Immutable log from NBOS audit storage (create and each status change after this feature
            shipped). Older runs may have an empty trail until new activity occurs.
          </p>
          <ul className="mt-3 space-y-0">
            {run.auditTrail.map((row) => (
              <PayrollAuditTrailEntry
                key={row.id}
                row={row}
                actorLabel={employeeName(row.actor)}
                formatAt={formatJournalAt}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Run journal</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {run.auditTrail.length > 0
            ? 'Summary milestones from payroll run timestamps. Every status hop is recorded in the audit trail above.'
            : 'Milestones from stored timestamps only. Intermediate workflow steps (e.g. review or paying) are not listed here until audit events exist for this run.'}
        </p>
        <ul className="mt-3 space-y-0">
          {run.journal.map((entry) => (
            <li
              key={`${entry.kind}-${entry.at}`}
              className="border-border flex flex-wrap items-start justify-between gap-2 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {PAYROLL_JOURNAL_KIND_LABEL[entry.kind]}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">{entry.summary}</p>
                {entry.actorName ? (
                  <p className="text-muted-foreground mt-1 text-xs">By {entry.actorName}</p>
                ) : null}
              </div>
              <time
                className="text-muted-foreground shrink-0 text-xs tabular-nums"
                dateTime={entry.at}
              >
                {formatJournalAt(entry.at)}
              </time>
            </li>
          ))}
        </ul>
      </section>

      <PayrollRunSalaryLinesTable lines={run.salaryLines} />
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-accent' : ''}`}>{value}</p>
    </div>
  );
}
