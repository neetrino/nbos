'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import { PayrollAllocationMatrixWorkspace } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-workspace';
import { PayrollRunDetailActions } from '@/features/finance/components/payroll/PayrollRunDetailActions';
import { usePayrollRunJournalAuditCsvExport } from '@/features/finance/components/payroll/use-payroll-run-journal-audit-csv-export';
import { usePayrollRunSalaryLinesCsvExport } from '@/features/finance/components/payroll/use-payroll-run-salary-lines-csv-export';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';
import { payrollRunsListHref } from '@/features/finance/constants/payroll-runs-list-url';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';

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

      <PayrollAllocationMatrixWorkspace payrollRunId={payrollRunId} />
    </div>
  );
}
