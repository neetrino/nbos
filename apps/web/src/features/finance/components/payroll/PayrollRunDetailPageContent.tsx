'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { PAYROLL_MATRIX_FULLSCREEN_Z } from '@/features/finance/constants/payroll-allocation-matrix-layout';
import {
  PAYROLL_RUN_DETAIL_VIEW_OPTIONS,
  isPayrollRunFullscreenViewMode,
  readPayrollRunDetailViewMode,
  type PayrollRunDetailViewMode,
  writePayrollRunDetailViewMode,
} from '@/features/finance/components/payroll/payroll-run-detail-view-options';
import { PayrollEmployeeBonusHistoryWorkspace } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-workspace';
import { PayrollRunSalaryLinesView } from '@/features/finance/components/payroll/payroll-run-salary-lines-view';
import { EmployeeMonthCompensationSheet } from '@/features/finance/components/payroll/employee-month-compensation-sheet';
import { PayrollRunDetailHeroBar } from '@/features/finance/components/payroll/PayrollRunDetailHeroBar';
import { PayrollRunDetailPageSettingsSheet } from '@/features/finance/components/payroll/PayrollRunDetailPageSettingsSheet';
import { PayrollRunDetailStatusActions } from '@/features/finance/components/payroll/PayrollRunDetailStatusActions';
import type {
  PayrollAllocationMatrix,
  PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';
import { usePayrollRunJournalAuditCsvExport } from '@/features/finance/components/payroll/use-payroll-run-journal-audit-csv-export';
import { usePayrollRunSalaryLinesCsvExport } from '@/features/finance/components/payroll/use-payroll-run-salary-lines-csv-export';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

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
  const [detailViewMode, setDetailViewMode] = useState<PayrollRunDetailViewMode>(() =>
    readPayrollRunDetailViewMode(),
  );
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixTotals, setMatrixTotals] = useState<PayrollAllocationMatrix['totals'] | null>(null);
  const [sheetSalaryLineId, setSheetSalaryLineId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layoutHeroActions, setLayoutHeroActions] = useState<PayrollMatrixLayoutHeroActions | null>(
    null,
  );
  const [matrixFullscreen, setMatrixFullscreen] = useState(false);

  useEffect(() => {
    setRun(initialRun);
    setLoading(initialLoading);
    setError(initialError);
  }, [initialError, initialLoading, initialRun]);

  useEffect(() => {
    if (!matrixFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMatrixFullscreen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [matrixFullscreen]);

  const handleDetailViewModeChange = useCallback((mode: PayrollRunDetailViewMode) => {
    setDetailViewMode(mode);
    writePayrollRunDetailViewMode(mode);
  }, []);

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
      totalBaseSalary: run.totalBaseSalary,
      totalBonuses: run.totalBonuses,
      totalPayable: run.totalPayable,
      totalPaid: run.totalPaid,
      totalRemaining: String(Math.max(0, payable - (Number.isFinite(paid) ? paid : 0))),
    };
  }, [matrixTotals, run]);

  const refreshRunQuiet = useCallback(async () => {
    try {
      const data = await payrollRunsApi.getById(payrollRunId);
      setRun(data);
    } catch {
      /* keep current run on background refresh failure */
    }
  }, [payrollRunId]);

  const handleOpenSalaryLine = useCallback((salaryLineId: string) => {
    setSheetSalaryLineId(salaryLineId);
    setSheetOpen(true);
  }, []);

  const matrixViewMode: PayrollMatrixViewMode =
    detailViewMode === 'ORDER_MATRIX' ? 'ORDER_MATRIX' : 'EMPLOYEE_MATRIX';

  const moduleHeroSlots = useMemo(() => {
    if (!run) {
      return {};
    }
    return {
      tabs: <PayrollRunDetailHeroBar run={run} backHref="/finance/payroll" />,
      search: (
        <IntegratedSearchFilters
          search={matrixSearch}
          onSearchChange={setMatrixSearch}
          searchPlaceholder={
            detailViewMode === 'SALARY_LINES'
              ? 'Search employee…'
              : detailViewMode === 'EMPLOYEE_BONUS_HISTORY'
                ? 'Search project…'
                : 'Search project, order, or employee…'
          }
          onClearAll={() => setMatrixSearch('')}
        />
      ),
      viewMode: matrixFullscreen ? undefined : (
        <ViewModeSwitch
          value={detailViewMode}
          onChange={handleDetailViewModeChange}
          options={PAYROLL_RUN_DETAIL_VIEW_OPTIONS}
          ariaLabel="Payroll run view"
        />
      ),
      trailing: (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Open allocation matrix full screen"
            onClick={() => setMatrixFullscreen(true)}
            disabled={!isPayrollRunFullscreenViewMode(detailViewMode)}
          >
            <Maximize2 className="size-4" aria-hidden />
          </Button>
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
    handleDetailViewModeChange,
    journalSubmitting,
    layoutHeroActions,
    matrixFullscreen,
    matrixSearch,
    detailViewMode,
    refreshRunQuiet,
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
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

      {statsTotals && !matrixFullscreen && detailViewMode !== 'EMPLOYEE_BONUS_HISTORY' ? (
        <PayrollAllocationMatrixStatsStrip
          lineCount={run.salaryLines.length}
          expenseCount={run.materializedExpenseLineCount}
          bonusReleaseCount={run.includedBonusReleaseCount}
          totals={statsTotals}
        />
      ) : null}

      <div
        className={
          matrixFullscreen
            ? cn(
                'bg-background fixed inset-0 flex min-h-0 flex-col p-3',
                PAYROLL_MATRIX_FULLSCREEN_Z,
              )
            : 'flex min-h-0 flex-1 flex-col'
        }
      >
        {matrixFullscreen ? (
          <div className="border-border bg-card absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded-lg border p-1.5 shadow-md">
            <ViewModeSwitch
              value={detailViewMode}
              onChange={handleDetailViewModeChange}
              options={PAYROLL_RUN_DETAIL_VIEW_OPTIONS}
              ariaLabel="Payroll run view"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Exit full screen"
              onClick={() => setMatrixFullscreen(false)}
            >
              <Minimize2 className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}

        {detailViewMode === 'SALARY_LINES' ? (
          <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
            <PayrollRunSalaryLinesView
              lines={run.salaryLines}
              search={matrixSearch}
              onOpenSalaryLine={handleOpenSalaryLine}
            />
          </section>
        ) : detailViewMode === 'EMPLOYEE_BONUS_HISTORY' ? (
          <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl p-1">
            <PayrollEmployeeBonusHistoryWorkspace
              payrollRunId={payrollRunId}
              search={matrixSearch}
              onSalaryLinesStale={() => void refreshRunQuiet()}
            />
          </section>
        ) : (
          <PayrollAllocationMatrixWorkspace
            payrollRunId={payrollRunId}
            viewMode={matrixViewMode}
            search={matrixSearch}
            fullscreen={matrixFullscreen}
            onTotalsChange={setMatrixTotals}
            onLayoutHeroActionsChange={setLayoutHeroActions}
            onOpenSalaryLine={handleOpenSalaryLine}
            onSalaryLinesStale={() => void refreshRunQuiet()}
          />
        )}
      </div>

      <EmployeeMonthCompensationSheet
        salaryLineId={sheetSalaryLineId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
