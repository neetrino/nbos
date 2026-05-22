'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { PayrollAuditTrailEntry } from '@/features/finance/components/payroll/PayrollAuditTrailEntry';
import { PayrollRunBonusReleasesSection } from '@/features/finance/components/payroll/payroll-run-bonus-releases-section';
import { PayrollRunDetailActions } from '@/features/finance/components/payroll/PayrollRunDetailActions';
import { PayrollRunEmployeeSalesKpiSection } from '@/features/finance/components/payroll/payroll-run-employee-sales-kpi-section';
import { PayrollRunSalesKpiSection } from '@/features/finance/components/payroll/payroll-run-sales-kpi-section';
import { PayrollRunSalaryLinesTable } from '@/features/finance/components/payroll/PayrollRunSalaryLinesTable';
import { EmployeeMonthCompensationSheet } from '@/features/finance/components/payroll/employee-month-compensation-sheet';
import { usePayrollRunJournalAuditCsvExport } from '@/features/finance/components/payroll/use-payroll-run-journal-audit-csv-export';
import { usePayrollRunSalaryLinesCsvExport } from '@/features/finance/components/payroll/use-payroll-run-salary-lines-csv-export';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';
import { payrollRunsListHref } from '@/features/finance/constants/payroll-runs-list-url';
import { PAYROLL_JOURNAL_KIND_LABEL } from '@/features/finance/constants/payroll-run-ui';
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

export function PayrollRunDetailPageContent({
  payrollRunId,
  initialRun,
  initialError,
  initialLoading,
  onReload,
}: {
  payrollRunId: string;
  initialRun: PayrollRunDetail | null;
  initialError: string | null;
  initialLoading: boolean;
  onReload: () => Promise<void>;
}) {
  const [run, setRun] = useState<PayrollRunDetail | null>(initialRun);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [openSalaryLineId, setOpenSalaryLineId] = useState<string | null>(null);

  useEffect(() => {
    setRun(initialRun);
    setLoading(initialLoading);
    setError(initialError);
  }, [initialError, initialLoading, initialRun]);

  const { exportCsvSubmitting, handleExportSalaryLinesCsv } =
    usePayrollRunSalaryLinesCsvExport(run);
  const { journalSubmitting, auditSubmitting, handleExportJournalCsv, handleExportAuditCsv } =
    usePayrollRunJournalAuditCsvExport(run);

  const applyStatus = useCallback(
    async (next: PayrollRunStatus) => {
      setStatusBusy(true);
      setActionError(null);
      try {
        const updated = await payrollRunsApi.updateStatus(payrollRunId, next);
        setRun(updated);
      } catch (caught) {
        setActionError(getApiErrorMessage(caught, 'Status could not be updated.'));
      } finally {
        setStatusBusy(false);
      }
    },
    [payrollRunId],
  );

  const handleReload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await onReload();
      const data = await payrollRunsApi.getById(payrollRunId);
      setRun(data);
    } catch (caught) {
      setRun(null);
      setError(getApiErrorMessage(caught, 'Payroll run could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [onReload, payrollRunId]);

  if (loading && !run) {
    return <LoadingState />;
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
        <ErrorState description={error ?? 'Not found'} onRetry={() => void handleReload()} />
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
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold">Payroll · {run.payrollMonth}</h1>
            <PayrollRunStatusBadge status={run.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {run.salaryLines.length} line(s) · {run.materializedExpenseLineCount} expense(s) ·{' '}
            {run.includedBonusReleaseCount} bonus release(s)
          </p>
        </div>
        <PayrollRunDetailActions
          run={run}
          onRefresh={handleReload}
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
          Expense cards materialize on approval.{' '}
          {run.status === 'APPROVED' || run.status === 'PAYING' ? (
            <>
              Record payments in{' '}
              <Link
                href={expensesPayrollPresetHref({ payrollMonth: run.payrollMonth })}
                className="text-primary font-medium hover:underline"
              >
                Pay now · payroll salary
              </Link>
              .
            </>
          ) : null}
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

      <PayrollRunEmployeeSalesKpiSection run={run} onUpdated={setRun} />

      <PayrollRunBonusReleasesSection run={run} onRunUpdated={setRun} />

      <PayrollRunSalaryLinesTable lines={run.salaryLines} onOpenMonth={setOpenSalaryLineId} />

      {run.auditTrail.length > 0 ? (
        <section className="border-border bg-card rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">Audit trail</h2>
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

      <EmployeeMonthCompensationSheet
        salaryLineId={openSalaryLineId}
        open={Boolean(openSalaryLineId)}
        onOpenChange={(next) => {
          if (!next) setOpenSalaryLineId(null);
        }}
      />
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
