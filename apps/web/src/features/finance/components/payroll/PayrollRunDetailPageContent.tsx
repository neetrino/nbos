'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import type { PayrollMatrixLayoutHeroActions } from '@/features/finance/components/payroll/allocation-matrix/payroll-matrix-layout-hero-actions';
import { PayrollAllocationMatrixStatsStrip } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-stats-strip';
import { PayrollAllocationMatrixWorkspace } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-workspace';
import { PAYROLL_ALLOCATION_MATRIX_VIEW_OPTIONS } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-view-options';
import { PayrollRunDetailPageSettingsSheet } from '@/features/finance/components/payroll/PayrollRunDetailPageSettingsSheet';
import { PayrollRunDetailStatusActions } from '@/features/finance/components/payroll/PayrollRunDetailStatusActions';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import type {
  PayrollAllocationMatrix,
  PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';
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
  const [matrixViewMode, setMatrixViewMode] = useState<PayrollMatrixViewMode>('EMPLOYEE_MATRIX');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixTotals, setMatrixTotals] = useState<PayrollAllocationMatrix['totals'] | null>(null);
  const [layoutHeroActions, setLayoutHeroActions] = useState<PayrollMatrixLayoutHeroActions | null>(
    null,
  );

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

  const statsTotals = useMemo((): PayrollAllocationMatrix['totals'] | null => {
    if (matrixTotals) return matrixTotals;
    if (!run) return null;
    const payable = Number.parseFloat(run.totalPayable);
    const paid = Number.parseFloat(run.totalPaid);
    if (!Number.isFinite(payable)) return null;
    return {
      totalPayable: run.totalPayable,
      totalPaid: run.totalPaid,
      totalRemaining: String(Math.max(0, payable - (Number.isFinite(paid) ? paid : 0))),
    };
  }, [matrixTotals, run]);

  const moduleHeroSlots = useMemo(() => {
    if (!run) {
      return {};
    }
    return {
      search: (
        <IntegratedSearchFilters
          search={matrixSearch}
          onSearchChange={setMatrixSearch}
          searchPlaceholder="Search project, order, or employee…"
          onClearAll={() => setMatrixSearch('')}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={matrixViewMode}
          onChange={setMatrixViewMode}
          options={PAYROLL_ALLOCATION_MATRIX_VIEW_OPTIONS}
          ariaLabel="Allocation matrix view"
        />
      ),
      trailing: (
        <>
          <PayrollRunDetailPageSettingsSheet
            run={run}
            onRefresh={handleReload}
            salaryExportSubmitting={exportCsvSubmitting}
            onExportSalaryLines={handleExportSalaryLinesCsv}
            journalSubmitting={journalSubmitting}
            onExportJournal={handleExportJournalCsv}
            auditSubmitting={auditSubmitting}
            onExportAudit={handleExportAuditCsv}
            resetLayoutDisabled={layoutHeroActions?.resetDisabled ?? true}
            onResetLayout={() => layoutHeroActions?.onResetLayout()}
          />
          <PayrollRunDetailStatusActions
            run={run}
            statusBusy={statusBusy}
            onApplyStatus={applyStatus}
          />
        </>
      ),
    };
  }, [
    applyStatus,
    auditSubmitting,
    exportCsvSubmitting,
    handleExportAuditCsv,
    handleExportJournalCsv,
    handleExportSalaryLinesCsv,
    handleReload,
    journalSubmitting,
    layoutHeroActions,
    matrixSearch,
    matrixViewMode,
    run,
    statusBusy,
  ]);

  useModuleHeroSlots(moduleHeroSlots);

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
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={listHrefForRunMonth}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Back to list
        </Link>
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-lg font-semibold">Payroll · {run.payrollMonth}</h1>
          <PayrollRunStatusBadge status={run.status} />
        </div>
        <p className="text-muted-foreground w-full text-xs sm:ml-auto sm:w-auto">
          {run.salaryLines.length} lines · {run.materializedExpenseLineCount} expenses ·{' '}
          {run.includedBonusReleaseCount} bonus releases
        </p>
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

      {statsTotals ? <PayrollAllocationMatrixStatsStrip totals={statsTotals} /> : null}

      <PayrollAllocationMatrixWorkspace
        payrollRunId={payrollRunId}
        viewMode={matrixViewMode}
        search={matrixSearch}
        onTotalsChange={setMatrixTotals}
        onLayoutHeroActionsChange={setLayoutHeroActions}
      />
    </div>
  );
}
